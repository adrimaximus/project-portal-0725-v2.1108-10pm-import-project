import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Collaborator, Attachment, Message, Conversation } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import debounce from 'lodash.debounce';

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
      setIsLoading(false);
      return;
    }

    const mappedConversations: Conversation[] = (data || []).map((c: any) => ({
      id: c.conversation_id,
      userName: c.is_group ? c.group_name : c.other_user_name,
      userAvatar: c.is_group ? c.avatar_url : c.other_user_avatar,
      lastMessage: c.last_message_content || "No messages yet.",
      lastMessageTimestamp: c.last_message_at || new Date(0).toISOString(),
      unreadCount: 0,
      messages: [], // will be preserved from previous state below
      isGroup: c.is_group,
      members: (c.participants || []).map((p: any) => ({
        id: p.id, name: p.name, avatar: p.avatar_url, initials: p.initials,
      })),
      created_by: c.created_by,
    }));

    // Merge to preserve existing messages for each conversation
    setConversations(prev => {
      const prevMap = new Map(prev.map(p => [p.id, p]));
      const merged = mappedConversations.map(c => {
        const existing = prevMap.get(c.id);
        return existing ? { ...c, messages: existing.messages } : c;
      });
      return merged.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
    });

    setIsLoading(false);
  }, [currentUser]);

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
        setMessageSearchResults((data || []).map((r: any) => r.conversation_id));
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
    if (!searchTerm) return conversations;

    const lower = searchTerm.toLowerCase();
    const nameMatches = conversations.filter(c => c.userName.toLowerCase().includes(lower));
    const messageMatches = conversations.filter(c => messageSearchResults.includes(c.id));

    const combined = new Map<string, Conversation>();
    nameMatches.forEach(c => combined.set(c.id, c));
    messageMatches.forEach(c => combined.set(c.id, c));

    return Array.from(combined.values()).sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
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
      return;
    }

    const mappedMessages: Message[] = (data || []).map((m: any) => ({
      id: m.id,
      text: m.content,
      timestamp: m.created_at,
      sender: m.sender ? {
        id: m.sender.id,
        name: `${m.sender.first_name || ''} ${m.sender.last_name || ''}`.trim() || m.sender.email,
        avatar: m.sender.avatar_url,
        initials: `${m.sender.first_name?.[0] || ''}${m.sender.last_name?.[0] || ''}`.toUpperCase(),
        email: m.sender.email,
      } : undefined,
      attachment: m.attachment_url ? { name: m.attachment_name, url: m.attachment_url, type: m.attachment_type } : undefined,
      message_type: m.message_type,
      reply_to_message_id: m.reply_to_message_id,
      is_deleted: m.is_deleted,
      is_forwarded: m.is_forwarded,
    }));

    setConversations(prev => prev.map(c => (c.id === id ? { ...c, messages: mappedMessages } : c)));
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('chat-room', { config: { broadcast: { self: false } } });

    const handleNewMessage = (payload: any) => {
      const newMessage = payload.new;
      const conversationId = newMessage.conversation_id;

      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === conversationId);
        if (idx === -1) {
          fetchConversations();
          return prev;
        }

        const updated = { ...prev[idx] };
        updated.lastMessage = newMessage.is_deleted ? "Message deleted" : (newMessage.content || "Attachment");
        updated.lastMessageTimestamp = newMessage.created_at;

        if (conversationId === selectedConversationId) {
          const senderProfile = newMessage.sender_id ? updated.members.find(m => m.id === newMessage.sender_id) : undefined;
          const mapped: Message = {
            id: newMessage.id,
            text: newMessage.content,
            timestamp: newMessage.created_at,
            sender: senderProfile ? {
              id: senderProfile.id, name: senderProfile.name, avatar: senderProfile.avatar,
              initials: senderProfile.initials, email: senderProfile.email,
            } : undefined,
            attachment: newMessage.attachment_url ? { name: newMessage.attachment_name, url: newMessage.attachment_url, type: newMessage.attachment_type } : undefined,
            message_type: newMessage.message_type,
            reply_to_message_id: newMessage.reply_to_message_id,
            is_deleted: newMessage.is_deleted,
            is_forwarded: newMessage.is_forwarded,
          };

          if (newMessage.sender_id === currentUser?.id) {
            let tempIndex = -1;
            for (let i = updated.messages.length - 1; i >= 0; i--) {
              if (updated.messages[i].id.startsWith('temp-')) { tempIndex = i; break; }
            }
            if (tempIndex > -1) {
              const copy = [...updated.messages];
              copy[tempIndex] = mapped;
              updated.messages = copy;
            } else {
              updated.messages = [...updated.messages, mapped];
            }
          } else {
            updated.messages = [...updated.messages, mapped];
          }
        }

        const newList = [...prev];
        newList.splice(idx, 1);
        newList.unshift(updated);
        return newList;
      });
    };

    const handleUpdatedMessage = (payload: any) => {
      const updatedMessage = payload.new;
      const conversationId = updatedMessage.conversation_id;
      if (conversationId !== selectedConversationId) return;

      setConversations(prev => prev.map(c => {
        if (c.id !== conversationId) return c;
        const newMessages = c.messages.map(m => m.id === updatedMessage.id ? { ...m, ...updatedMessage, text: updatedMessage.content } : m);
        return { ...c, messages: newMessages };
      }));
    };

    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handleNewMessage);
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, handleUpdatedMessage);
    
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, (payload: any) => {
        const updatedConv = payload.new;
        setConversations(prev => {
            const index = prev.findIndex(c => c.id === updatedConv.id);
            if (index === -1) return prev;
            const newConversations = [...prev];
            const existingConv = newConversations[index];
            newConversations[index] = { ...existingConv, userName: updatedConv.is_group ? updatedConv.group_name : existingConv.userName, userAvatar: updatedConv.avatar_url };
            return newConversations;
        });
    });

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants' }, () => { fetchConversations(); });

    channel.on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload?.userId && payload.userId !== currentUser?.id && payload.conversationId === selectedConversationId) {
          setIsSomeoneTyping(true);
          if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
          typingTimerRef.current = window.setTimeout(() => setIsSomeoneTyping(false), 1500);
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, selectedConversationId, fetchConversations]);

  useEffect(() => {
    const collaboratorToChat = (location.state as any)?.selectedCollaborator as Collaborator | undefined;
    if (collaboratorToChat && currentUser) {
      handleStartNewChat(collaboratorToChat);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, currentUser, navigate]);

  const handleSendMessage = async (text: string, attachment: Attachment | null, replyToId: string | null) => {
    if (!selectedConversationId || !currentUser) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = { id: tempId, text, timestamp: new Date().toISOString(), sender: currentUser, attachment, message_type: 'user', reply_to_message_id: replyToId };

    setConversations(prev => prev.map(c =>
      c.id === selectedConversationId
        ? { ...c, messages: [...c.messages, optimistic], lastMessage: text || "Attachment", lastMessageTimestamp: new Date().toISOString() }
        : c
    ));

    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConversationId,
      sender_id: currentUser.id,
      content: text,
      attachment_url: attachment?.url,
      attachment_name: attachment?.name,
      attachment_type: attachment?.type,
      message_type: 'user',
      reply_to_message_id: replyToId,
    });

    if (error) {
      toast.error("Failed to send message.", { description: error.message });
      setConversations(prev => prev.map(c =>
        c.id === selectedConversationId
          ? { ...c, messages: c.messages.filter(m => m.id !== tempId) }
          : c
      ));
    }
  };

  const handleForwardMessages = async (destinationConversationId: string, messages: Message[]) => {
    if (!currentUser || messages.length === 0) return;

    const messagesToInsert = messages
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(message => ({
        conversation_id: destinationConversationId,
        sender_id: currentUser.id,
        content: message.text,
        attachment_url: message.attachment?.url,
        attachment_name: message.attachment?.name,
        attachment_type: message.attachment?.type,
        message_type: 'user' as const,
        is_forwarded: true,
      }));

    const { error } = await supabase.from('messages').insert(messagesToInsert);

    if (error) {
      toast.error("Failed to forward messages.", { description: error.message });
    } else {
      toast.success(`${messages.length} message(s) forwarded successfully.`);
      fetchConversations();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase.rpc('soft_delete_message', { p_message_id: messageId });
    if (error) {
      toast.error("Failed to delete message.", { description: error.message });
    } else {
      toast.success("Message deleted.");
      // Optimistic update
      setConversations(prev => prev.map(c => {
        if (c.id !== selectedConversationId) return c;
        const newMessages = c.messages.map(m => m.id === messageId ? { ...m, is_deleted: true, text: null, attachment: null } : m);
        return { ...c, messages: newMessages };
      }));
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
    if (error) toast.error("Failed to leave group.", { description: error.message });
    else {
      toast.success("You have left the group.");
      if (selectedConversationId === conversationId) setSelectedConversationId(null);
      fetchConversations();
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    const { error } = await supabase.rpc('hide_conversation', { p_conversation_id: conversationId });
    if (error) toast.error("Failed to delete chat.", { description: error.message });
    else {
      toast.success("Chat has been removed from your list.");
      if (selectedConversationId === conversationId) setSelectedConversationId(null);
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
    handleForwardMessages,
    handleDeleteMessage,
    handleClearChat,
    handleStartNewChat,
    handleStartNewGroupChat,
    sendTyping,
    fetchConversations,
    handleLeaveGroup,
    handleDeleteConversation,
  };
};