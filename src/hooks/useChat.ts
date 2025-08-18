import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Collaborator, Attachment, Message, Conversation } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isSomeoneTyping, setIsSomeoneTyping] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const messageChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const conversationsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const messagesGlobalChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimerRef = useRef<number | null>(null);

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
        id: p.id, name: p.name, avatar: p.avatar_url, initials: p.initials, online: true,
      })),
    }));
    setConversations(mappedConversations);
  }, [currentUser]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleConversationSelect = useCallback(async (id: string | null) => {
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current);
      messageChannelRef.current = null;
    }
    
    setSelectedConversationId(id);
    setIsSomeoneTyping(false);

    if (!id) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(id, first_name, last_name, avatar_url, email)')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error("Failed to fetch messages.");
      return;
    }

    const mappedMessages: Message[] = (data || []).map((m: any) => ({
      id: m.id, text: m.content, timestamp: m.created_at,
      sender: {
        id: m.sender.id,
        name: `${m.sender.first_name || ''} ${m.sender.last_name || ''}`.trim() || m.sender.email,
        avatar: m.sender.avatar_url,
        initials: `${m.sender.first_name?.[0] || ''}${m.sender.last_name?.[0] || ''}`.toUpperCase(),
        email: m.sender.email,
      },
      attachment: m.attachment_url ? { name: m.attachment_name, url: m.attachment_url, type: m.attachment_type } : undefined,
    }));

    setConversations(prev => prev.map(c => (c.id === id ? { ...c, messages: mappedMessages } : c)));

    const ch = supabase.channel(`conversation:${id}`, { config: { broadcast: { self: true } } });
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, (payload: any) => {
      const newMessage = payload.new as any;
      if (newMessage.sender_id === currentUser?.id) return;
      fetchConversations(); // Refresh list to bring to top
      handleConversationSelect(id); // Re-fetch messages for current conversation
    });
    ch.on('broadcast', { event: 'typing' }, (payload: any) => {
      if (payload?.userId && payload.userId !== currentUser?.id) {
        setIsSomeoneTyping(true);
        if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = window.setTimeout(() => setIsSomeoneTyping(false), 1500);
      }
    });
    ch.subscribe();
    messageChannelRef.current = ch;
  }, [currentUser, fetchConversations]);

  useEffect(() => {
    if (!currentUser) return;
    const ch = supabase.channel('conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => fetchConversations())
      .subscribe();
    conversationsChannelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [currentUser, fetchConversations]);

  useEffect(() => {
    if (!currentUser) return;
    const ch = supabase.channel('messages-global')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload: any) => {
        const msg = payload.new as any;
        if (!msg || msg.sender_id === currentUser.id) return;
        if (!selectedConversationId) {
          await fetchConversations();
          handleConversationSelect(msg.conversation_id);
        }
      })
      .subscribe();
    messagesGlobalChannelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [currentUser, selectedConversationId, fetchConversations, handleConversationSelect]);

  useEffect(() => {
    const collaboratorToChat = (location.state as any)?.selectedCollaborator as Collaborator | undefined;
    if (collaboratorToChat && currentUser) {
      const existingConvo = conversations.find(c => !c.isGroup && c.members?.some(m => m.id === collaboratorToChat.id));
      if (existingConvo) {
        handleConversationSelect(existingConvo.id);
      } else {
        handleStartNewChat(collaboratorToChat);
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, currentUser, conversations, navigate, handleConversationSelect]);

  const handleSendMessage = async (text: string, attachment: Attachment | null) => {
    if (!selectedConversationId || !currentUser) return;
    const convo = conversations.find(c => c.id === selectedConversationId);
    if (!convo) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = { id: tempId, text, timestamp: new Date().toISOString(), sender: currentUser, attachment };
    setConversations(prev => prev.map(c => c.id === selectedConversationId ? { ...c, messages: [...c.messages, optimistic] } : c));

    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConversationId, sender_id: currentUser.id, content: text,
      attachment_url: attachment?.url, attachment_name: attachment?.name, attachment_type: attachment?.type,
    });

    if (error) {
      toast.error("Failed to send message.", { description: error.message });
      setConversations(prev => prev.map(c => c.id === selectedConversationId ? { ...c, messages: c.messages.filter(m => m.id !== tempId) } : c));
    } else {
      fetchConversations();
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

  const sendTyping = useCallback(() => {
    if (messageChannelRef.current) {
      messageChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser?.id } });
    }
  }, [currentUser]);

  return {
    conversations,
    selectedConversationId,
    isSomeoneTyping,
    handleConversationSelect,
    handleSendMessage,
    handleClearChat,
    handleStartNewChat,
    handleStartNewGroupChat,
    sendTyping,
  };
};