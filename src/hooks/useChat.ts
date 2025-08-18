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
  const [isLoading, setIsLoading] = useState(true);

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
        userAvatar: c.is_group ? undefined : c.other_user_avatar,
        lastMessage: c.last_message_content || "No messages yet.",
        lastMessageTimestamp: c.last_message_at || new Date(0).toISOString(),
        unreadCount: 0,
        messages: [],
        isGroup: c.is_group,
        members: (c.participants || []).map((p: any) => ({
          id: p.id, name: p.name, avatar: p.avatar_url, initials: p.initials,
        })),
      }));
      setConversations(mappedConversations);
    }
    setIsLoading(false);
  }, [currentUser]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

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
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('chat-room', { config: { broadcast: { self: false } } });

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        const newMessage = payload.new;
        const conversationId = newMessage.conversation_id;

        setConversations(prev => {
          const convoIndex = prev.findIndex(c => c.id === conversationId);
          if (convoIndex === -1) {
            fetchConversations(); // New conversation, refetch list
            return prev;
          }

          const updatedConvo = { ...prev[convoIndex] };
          updatedConvo.lastMessage = newMessage.content || "Attachment";
          updatedConvo.lastMessageTimestamp = newMessage.created_at;

          if (conversationId === selectedConversationId) {
            const senderProfile = updatedConvo.members.find(m => m.id === newMessage.sender_id);
            const mappedMessage: Message = {
              id: newMessage.id, text: newMessage.content, timestamp: newMessage.created_at,
              sender: {
                id: senderProfile?.id || '', name: senderProfile?.name || 'Unknown',
                avatar: senderProfile?.avatar, initials: senderProfile?.initials || '??',
                email: senderProfile?.email,
              },
              attachment: newMessage.attachment_url ? { name: newMessage.attachment_name, url: newMessage.attachment_url, type: newMessage.attachment_type } : undefined,
            };
            updatedConvo.messages = [...updatedConvo.messages, mappedMessage];
          }

          const newConversations = [...prev];
          newConversations.splice(convoIndex, 1);
          newConversations.unshift(updatedConvo);
          return newConversations;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
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
    const optimistic: Message = { id: tempId, text, timestamp: new Date().toISOString(), sender: currentUser, attachment };
    setConversations(prev => prev.map(c => c.id === selectedConversationId ? { ...c, messages: [...c.messages, optimistic], lastMessage: text || "Attachment", lastMessageTimestamp: new Date().toISOString() } : c));

    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConversationId, sender_id: currentUser.id, content: text,
      attachment_url: attachment?.url, attachment_name: attachment?.name, attachment_type: attachment?.type,
    });

    if (error) {
      toast.error("Failed to send message.", { description: error.message });
      setConversations(prev => prev.map(c => c.id === selectedConversationId ? { ...c, messages: c.messages.filter(m => m.id !== tempId) } : c));
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
    const channel = supabase.channel('chat-room');
    channel.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser?.id, conversationId: selectedConversationId } });
  }, [currentUser, selectedConversationId]);

  return {
    conversations,
    selectedConversationId,
    isSomeoneTyping,
    isLoading,
    handleConversationSelect,
    handleSendMessage,
    handleClearChat,
    handleStartNewChat,
    handleStartNewGroupChat,
    sendTyping,
  };
};