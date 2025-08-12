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
      lastMessageTimestamp: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      unreadCount: 0,
      messages: [],
      isGroup: c.is_group,
      members: c.participants.map((p: any) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar_url,
        initials: p.initials,
        online: true, // Placeholder
      })),
    }));

    setConversations(mappedConversations);
    if (!isMobile && mappedConversations.length > 0) {
      setSelectedConversationId(mappedConversations[0].id);
    }
  }, [currentUser, isMobile]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new as any;
        setConversations(prev => prev.map(convo => {
          if (convo.id === newMessage.conversation_id) {
            // This is a simplified update. A full implementation would fetch the sender's profile.
            const updatedConvo = { ...convo, lastMessage: newMessage.content, lastMessageTimestamp: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            if (convo.id === selectedConversationId) {
              // If the conversation is open, add the message to the view
              const sender = convo.members?.find(m => m.id === newMessage.sender_id) || currentUser;
              if (sender) {
                updatedConvo.messages = [...convo.messages, {
                  id: newMessage.id,
                  text: newMessage.content,
                  timestamp: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  sender: sender,
                  attachment: newMessage.attachment_url ? { name: newMessage.attachment_name, url: newMessage.attachment_url, type: newMessage.attachment_type } : undefined,
                }];
              }
            }
            return updatedConvo;
          }
          return convo;
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedConversationId, currentUser]);

  const handleConversationSelect = async (id: string) => {
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
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
  };

  const handleSendMessage = async (conversationId: string, messageText: string, attachment: Attachment | null) => {
    if (!conversationId || !currentUser) return;

    let attachmentData = {};
    if (attachment) {
      // In a real app, you'd upload the file to Supabase Storage first
      // For now, we'll just save the URL if it's already hosted
      attachmentData = {
        attachment_url: attachment.url,
        attachment_name: attachment.name,
        attachment_type: attachment.type,
      };
    }

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: messageText,
      ...attachmentData,
    });
  };

  const handleStartNewChat = async (collaborator: Collaborator) => {
    if (!currentUser) return;
    const { data, error } = await supabase.rpc('create_or_get_conversation', {
      p_other_user_id: collaborator.id,
      p_is_group: false
    });

    if (error) {
      toast.error("Failed to start chat.");
    } else {
      await fetchConversations();
      setSelectedConversationId(data);
    }
  };

  const handleStartNewGroupChat = (
    members: Collaborator[],
    groupName: string
  ) => {
    // This would require a more complex RPC function in Supabase
    toast.info("Group chat creation is not fully implemented yet.");
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