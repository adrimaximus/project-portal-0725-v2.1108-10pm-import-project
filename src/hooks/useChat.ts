import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Collaborator, Attachment, Message, Conversation } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import debounce from 'lodash.debounce';
import { getInitials } from "@/lib/utils";

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isSomeoneTyping, setIsSomeoneTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageSearchResults, setMessageSearchResults] = useState<string[]>([]);

  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const typingTimerRef = useRef<number | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    const { data, error } = await supabase.rpc('get_user_conversations');
    if (error) {
      toast.error("Failed to fetch conversations.");
      console.error(error);
    } else {
      const mappedConversations: Conversation[] = data.map((c: any) => ({
        id: c.conversation_id,
        userName: c.is_group ? c.group_name : c.other_user_name,
        userAvatar: c.is_group ? c.avatar_url : c.other_user_avatar,
        lastMessage: c.last_message_content || "No messages yet.",
        lastMessageTimestamp: c.last_message_at || new Date(0).toISOString(),
        unreadCount: 0,
        messages: [],
        isGroup: c.is_group,
        members: (c.participants || []).map((p: any) => ({
          id: p.id, name: p.name, avatar: p.avatar_url, initials: p.initials,
        })),
        created_by: c.created_by,
      }));
      
      setConversations(prevConversations => {
        return mappedConversations.map(newConvo => {
          const oldConvo = prevConversations.find(p => p.id === newConvo.id);
          if (oldConvo && newConvo.id === selectedConversationId) {
            return { ...newConvo, messages: oldConvo.messages };
          }
          return newConvo;
        });
      });
    }
    setIsLoading(false);
  }, [currentUser, selectedConversationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const debouncedSearchMessages = useCallback(
    debounce(async (term: string) => {
      const { data, error } = await supabase.rpc('search_conversations', { p_search_term: term });
      if (error) {
        console.error("Message search error:", error);
        setMessageSearchResults([]);
      } else {
        setMessageSearchResults(data.map((r: any) => r.conversation_id));
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (searchTerm.length > 2) {
      debouncedSearchMessages(searchTerm);
    } else {
      setMessageSearchResults([]);
    }
  }, [searchTerm, debouncedSearchMessages]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm) {
      return conversations;
    }

    const lowercasedSearchTerm = searchTerm.toLowerCase();
    
    const nameMatches = conversations.filter(c =>
      c.userName.toLowerCase().includes(lowercasedSearchTerm)
    );

    const messageMatches = conversations.filter(c =>
      messageSearchResults.includes(c.id)
    );

    const combined = new Map<string, Conversation>();
    nameMatches.forEach(c => combined.set(c.id, c));
    messageMatches.forEach(c => combined.set(c.id, c));

    return Array.from(combined.values()).sort((a, b) => 
      new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
    );
  }, [conversations, searchTerm, messageSearchResults]);

  const handleConversationSelect = useCallback(async (id: string | null) => {
    setSelectedConversationId(id);
    if (!id) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(id, first_name, last_name, avatar_url, email)')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error("Failed to fetch messages.");
      console.error("Message fetch error:", error);
      return;
    }

    const mappedMessages: Message[] = (data || []).map((m: any) => {
      if (!m.sender) {
        return {
          id: m.id, text: m.content, timestamp: m.created_at,
          sender: { id: m.sender_id, name: 'Deleted User', avatar: undefined, initials: 'DU', email: '' },
          attachment: m.attachment_url ? { name: m.attachment_name, url: m.attachment_url, type: m.attachment_type } : undefined,
        };
      }
      const senderName = `${m.sender.first_name || ''} ${m.sender.last_name || ''}`.trim();
      return {
        id: m.id, text: m.content, timestamp: m.created_at,
        sender: {
          id: m.sender.id,
          name: senderName || m.sender.email,
          avatar: m.sender.avatar_url,
          initials: getInitials(senderName, m.sender.email) || 'NN',
          email: m.sender.email,
        },
        attachment: m.attachment_url ? { name: m.attachment_name, url: m.attachment_url, type: m.attachment_type } : undefined,
      }
    });

    setConversations(prev => prev.map(c => (c.id === id ? { ...c, messages: mappedMessages } : c)));
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('chat-room');

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload: any) => {
        const newMessage = payload.new;
        
        if (newMessage.sender_id === currentUser?.id) return;

        setConversations(prev => {
          const conversationId = newMessage.conversation_id;
          const convoIndex = prev.findIndex(c => c.id === conversationId);

          if (convoIndex === -1) {
            fetchConversations();
            return prev;
          }

          const currentConvo = prev[convoIndex];
          const senderProfile = currentConvo.members.find(m => m.id === newMessage.sender_id);
          const finalSender = senderProfile || { id: newMessage.sender_id, name: 'Unknown User', avatar: '', initials: '??', email: '' };
          
          const mappedMessage: Message = {
            id: newMessage.id, text: newMessage.content, timestamp: newMessage.created_at,
            sender: finalSender,
            attachment: newMessage.attachment_url ? { name: newMessage.attachment_name, url: newMessage.attachment_url, type: newMessage.attachment_type } : undefined,
          };

          const updatedConvo = { ...currentConvo };
          updatedConvo.lastMessage = newMessage.content || "Attachment";
          updatedConvo.lastMessageTimestamp = newMessage.created_at;

          if (conversationId === selectedConversationId) {
              if (!updatedConvo.messages.some(m => m.id === mappedMessage.id)) {
                  updatedConvo.messages = [...updatedConvo.messages, mappedMessage];
              }
          }

          const newConversations = [...prev];
          newConversations.splice(convoIndex, 1);
          newConversations.unshift(updatedConvo);
          return newConversations;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, async () => {
        fetchConversations();
      })
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload?.userId && payload.userId !== currentUser?.id && payload.conversationId === selectedConversationId) {
          setIsSomeoneTyping(true);
          if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
          typingTimerRef.current = window.setTimeout(() => setIsSomeoneTyping(false), 1500);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, selectedConversationId, fetchConversations]);

  useEffect(() => {
    const collaboratorToChat = (location.state as any)?.selectedCollaborator as Collaborator | undefined;
    if (collaboratorToChat && currentUser) {
      handleStartNewChat(collaboratorToChat);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, currentUser, navigate]);

  const handleSendMessage = async (text: string, attachment: Attachment | null) => {
    if (!selectedConversationId || !currentUser) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      text,
      timestamp: new Date().toISOString(),
      sender: currentUser,
      attachment,
    };

    setConversations(prev =>
      prev.map(c =>
        c.id === selectedConversationId
          ? {
              ...c,
              messages: [...c.messages, optimisticMessage],
              lastMessage: text || "Attachment",
              lastMessageTimestamp: new Date().toISOString(),
            }
          : c
      )
    );

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversationId,
        sender_id: currentUser.id,
        content: text,
        attachment_url: attachment?.url,
        attachment_name: attachment?.name,
        attachment_type: attachment?.type,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to send message.", { description: error.message });
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConversationId
            ? { ...c, messages: c.messages.filter(m => m.id !== tempId) }
            : c
        )
      );
    } else {
      const realMessage: Message = {
        id: data.id,
        text: data.content,
        timestamp: data.created_at,
        sender: currentUser,
        attachment: data.attachment_url
          ? { name: data.attachment_name, url: data.attachment_url, type: data.attachment_type }
          : undefined,
      };
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConversationId
            ? { ...c, messages: c.messages.map(m => (m.id === tempId ? realMessage : m)) }
            : c
        )
      );
    }
  };

  const handleStartNewChat = async (collaborator: Collaborator) => {
    if (!currentUser) return;
    const { data, error } = await supabase.rpc('create_or_get_conversation', { p_other_user_id: collaborator.id, p_is_group: false });
    if (!error && data) {
      await fetchConversations();
      handleConversationSelect(data as string);
    }
  };

  const handleStartNewGroupChat = async (members: Collaborator[], groupName: string) => {
    if (!currentUser) return;
    const { data, error } = await supabase.rpc('create_group_conversation', { p_group_name: groupName, p_participant_ids: members.map(m => m.id) });
    if (!error && data) {
      await fetchConversations();
      handleConversationSelect(data as string);
    }
  };

  const handleClearChat = async (conversationId: string) => {
    const { error } = await supabase.from('messages').delete().eq('conversation_id', conversationId);
    if (error) toast.error("Failed to clear chat history.");
    else {
      toast.success("Chat history has been cleared.");
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, messages: [], lastMessage: "Chat cleared", lastMessageTimestamp: new Date().toISOString() } : c));
    }
  };

  const handleLeaveGroup = async (conversationId: string) => {
    const { error } = await supabase.rpc('leave_group', { p_conversation_id: conversationId });
    if (error) {
      toast.error("Failed to leave group.", { description: error.message });
    } else {
      toast.success("You have left the group.");
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
      fetchConversations();
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const { error } = await supabase.rpc('hide_conversation', { p_conversation_id: conversationId });
    if (error) {
      toast.error("Failed to delete chat.", { description: error.message });
    } else {
      toast.success("Chat has been removed from your list.");
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
      setConversations(prev => prev.filter(c => c.id !== conversationId));
    }
  };

  const sendTyping = useCallback(() => {
    const channel = supabase.channel('chat-room');
    channel.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser?.id, conversationId: selectedConversationId } });
  }, [currentUser, selectedConversationId]);

  return {
    conversations: filteredConversations,
    selectedConversationId,
    isSomeoneTyping,
    isLoading,
    searchTerm,
    setSearchTerm,
    handleConversationSelect,
    handleSendMessage,
    handleClearChat,
    handleStartNewChat,
    handleStartNewGroupChat,
    sendTyping,
    fetchConversations,
    handleLeaveGroup,
    handleDeleteConversation,
  };
};