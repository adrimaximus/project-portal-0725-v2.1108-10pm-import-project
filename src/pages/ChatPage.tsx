import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import PortalLayout from "@/components/PortalLayout";
import { Collaborator, Attachment, User, Message, Conversation } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ChatPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user: currentUser } = useAuth();

  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;

    const { data, error } = await supabase.rpc('get_user_conversations');

    if (error) {
      toast.error("Failed to fetch conversations.");
      console.error(error);
      return;
    }

    const mappedConversations: Conversation[] = data.map((c: any) => ({
      id: c.conversation_id,
      userName: c.is_group ? c.group_name : c.other_user_name,
      userAvatar: c.is_group ? undefined : c.other_user_avatar,
      lastMessage: c.last_message_content || "No messages yet.",
      lastMessageTimestamp: c.last_message_at || new Date(0).toISOString(),
      unreadCount: 0,
      messages: [],
      isGroup: c.is_group,
      members: (c.participants || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar_url,
        initials: p.initials,
        online: true, // Placeholder
      })),
    }));

    setConversations(mappedConversations);
    if (!isMobile && mappedConversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(mappedConversations[0].id);
    }
  }, [currentUser, isMobile, selectedConversationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleConversationSelect = useCallback(async (id: string) => {
    setSelectedConversationId(id);
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(id, first_name, last_name, avatar_url, email)')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error("Failed to fetch messages.");
      return;
    }

    const mappedMessages: Message[] = data.map((m: any) => ({
      id: m.id,
      text: m.content,
      timestamp: m.created_at,
      sender: {
        id: m.sender.id,
        name: `${m.sender.first_name || ''} ${m.sender.last_name || ''}`.trim(),
        avatar: m.sender.avatar_url,
        initials: `${m.sender.first_name?.[0] || ''}${m.sender.last_name?.[0] || ''}`.toUpperCase(),
        email: m.sender.email,
      },
      attachment: m.attachment_url ? { name: m.attachment_name, url: m.attachment_url, type: m.attachment_type } : undefined,
    }));

    setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: mappedMessages } : c));
  }, []);

  const handleStartNewChat = useCallback(async (collaborator: Collaborator) => {
    if (!currentUser) return;
    const { data, error } = await supabase.rpc('create_or_get_conversation', {
      p_other_user_id: collaborator.id,
      p_is_group: false
    });

    if (error) {
      toast.error("Failed to start chat.");
      console.error("Failed to start chat:", error);
    } else {
      await fetchConversations();
      handleConversationSelect(data);
    }
  }, [currentUser, fetchConversations, handleConversationSelect]);

  useEffect(() => {
    const collaboratorToChat = location.state?.selectedCollaborator;
    if (collaboratorToChat && currentUser) {
      const existingConvo = conversations.find(c => 
        !c.isGroup && c.members?.some(m => m.id === collaboratorToChat.id && m.id !== currentUser.id)
      );

      if (existingConvo) {
        handleConversationSelect(existingConvo.id);
      } else {
        handleStartNewChat(collaboratorToChat);
      }
      
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, currentUser, conversations, navigate, handleConversationSelect, handleStartNewChat]);

  useEffect(() => {
    if (!currentUser) return;

    const handleNewMessage = async (payload: any) => {
      const newMessage = payload.new as any;
      if (newMessage.sender_id === currentUser?.id) {
        return;
      }

      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, email')
        .eq('id', newMessage.sender_id)
        .single();

      if (!senderProfile) {
        console.warn("Could not find profile for sender:", newMessage.sender_id);
        return;
      }

      const sender: User = {
        id: senderProfile.id,
        name: `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || senderProfile.email || 'Unknown',
        avatar: senderProfile.avatar_url,
        initials: `${senderProfile.first_name?.[0] || ''}${senderProfile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
        email: senderProfile.email || '',
      };

      setConversations(prev => prev.map(convo => {
        if (convo.id === newMessage.conversation_id) {
          const updatedConvo = {
            ...convo,
            lastMessage: newMessage.content || (newMessage.attachment_name || 'Attachment'),
            lastMessageTimestamp: newMessage.created_at,
          };

          if (convo.id === selectedConversationId) {
            const messageExists = convo.messages.some(m => m.id === newMessage.id);
            if (!messageExists) {
              updatedConvo.messages = [...convo.messages, {
                id: newMessage.id,
                text: newMessage.content,
                timestamp: newMessage.created_at,
                sender: sender,
                attachment: newMessage.attachment_url ? { name: newMessage.attachment_name, url: newMessage.attachment_url, type: newMessage.attachment_type } : undefined,
              }];
            }
          }
          return updatedConvo;
        }
        return convo;
      }));
    };

    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handleNewMessage)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedConversationId, currentUser]);

  const handleSendMessage = async (conversationId: string, messageText: string, attachment: Attachment | null) => {
    if (!conversationId || !currentUser) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      text: messageText,
      timestamp: new Date().toISOString(),
      sender: currentUser,
      attachment: attachment,
    };

    setConversations(prev =>
      prev.map(convo => {
        if (convo.id === conversationId) {
          return {
            ...convo,
            messages: [...convo.messages, optimisticMessage],
            lastMessage: messageText || (attachment ? attachment.name : 'Attachment'),
            lastMessageTimestamp: optimisticMessage.timestamp,
          };
        }
        return convo;
      })
    );

    let attachmentData = {};
    if (attachment) {
      attachmentData = {
        attachment_url: attachment.url,
        attachment_name: attachment.name,
        attachment_type: attachment.type,
      };
    }

    const { data: dbMessage, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: messageText,
        ...attachmentData,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to send message.", { description: error.message });
      setConversations(prev =>
        prev.map(convo => {
          if (convo.id === conversationId) {
            return {
              ...convo,
              messages: convo.messages.filter(m => m.id !== tempId),
            };
          }
          return convo;
        })
      );
    } else {
      setConversations(prev =>
        prev.map(convo => {
          if (convo.id === conversationId) {
            return {
              ...convo,
              messages: convo.messages.map(m =>
                m.id === tempId ? { ...m, id: dbMessage.id, timestamp: dbMessage.created_at } : m
              ),
            };
          }
          return convo;
        })
      );
    }
  };

  const handleStartNewGroupChat = async (
    members: Collaborator[],
    groupName: string
  ) => {
    if (!currentUser) return;
    if (members.length === 0 || !groupName) {
      toast.error("Please select members and provide a group name.");
      return;
    }

    const participantIds = members.map(m => m.id);
    
    const { data, error } = await supabase.rpc('create_group_conversation', {
      p_group_name: groupName,
      p_participant_ids: participantIds
    });

    if (error) {
      toast.error("Failed to create group chat.");
      console.error("Failed to create group chat:", error);
    } else {
      await fetchConversations();
      handleConversationSelect(data);
    }
  };

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  if (isMobile) {
    return (
      <PortalLayout noPadding>
        <div className="h-full">
          {!selectedConversation ? (
            <ChatList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleConversationSelect}
              onStartNewChat={handleStartNewChat}
              onStartNewGroupChat={handleStartNewGroupChat}
            />
          ) : (
            <ChatWindow
              selectedConversation={selectedConversation}
              onSendMessage={(text, attachment) => handleSendMessage(selectedConversation.id, text, attachment)}
              onBack={() => setSelectedConversationId(null)}
            />
          )}
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout noPadding>
      <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-full">
        <ChatList
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleConversationSelect}
          onStartNewChat={handleStartNewChat}
          onStartNewGroupChat={handleStartNewGroupChat}
        />
        <ChatWindow
          selectedConversation={selectedConversation}
          onSendMessage={(text, attachment) => handleSendMessage(selectedConversationId!, text, attachment)}
        />
      </div>
    </PortalLayout>
  );
};

export default ChatPage;