import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Collaborator, Attachment, Message, Conversation } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import debounce from 'lodash.debounce';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getInitials } from "@/lib/utils";

// Helper function to map conversation data
const mapConversationData = (c: any): Omit<Conversation, 'messages'> => ({
  id: c.conversation_id,
  userName: c.is_group ? c.group_name : c.other_user_name,
  userAvatar: c.is_group ? c.avatar_url : c.other_user_avatar,
  lastMessage: c.last_message_content || "No messages yet.",
  lastMessageTimestamp: c.last_message_at || new Date(0).toISOString(),
  unreadCount: 0,
  isGroup: c.is_group,
  members: (c.participants || []).map((p: any) => ({
    id: p.id, name: p.name, avatar: p.avatar_url, initials: p.initials,
  })),
  created_by: c.created_by,
});

export const useChat = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isSomeoneTyping, setIsSomeoneTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageSearchResults, setMessageSearchResults] = useState<string[]>([]);

  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const typingTimerRef = useRef<number | null>(null);

  const { data: conversations = [], isLoading: isLoadingConversations, refetch: fetchConversations } = useQuery({
    queryKey: ['conversations', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const { data, error } = await supabase.rpc('get_user_conversations');
      if (error) {
        toast.error("Failed to fetch conversations.");
        console.error(error);
        return [];
      }
      return data.map(mapConversationData);
    },
    enabled: !!currentUser,
  });

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
    if (!searchTerm) return conversations;
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const nameMatches = conversations.filter(c => c.userName.toLowerCase().includes(lowercasedSearchTerm));
    const messageMatches = conversations.filter(c => messageSearchResults.includes(c.id));
    const combined = new Map<string, Omit<Conversation, 'messages'>>();
    nameMatches.forEach(c => combined.set(c.id, c));
    messageMatches.forEach(c => combined.set(c.id, c));
    return Array.from(combined.values()).sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
  }, [conversations, searchTerm, messageSearchResults]);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('chat-room');
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
        const newMessage = payload.new;
        const conversationId = newMessage.conversation_id;
        
        queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });

        queryClient.setQueryData(['messages', conversationId], (oldData: Message[] | undefined) => {
          const currentConvo = conversations.find(c => c.id === conversationId);
          const senderProfile = currentConvo?.members.find(m => m.id === newMessage.sender_id);
          
          const senderName = senderProfile ? senderProfile.name : 'Unknown User';
          const mappedMessage: Message = {
            id: newMessage.id,
            text: newMessage.content,
            timestamp: newMessage.created_at,
            sender: senderProfile || { id: newMessage.sender_id, name: 'Unknown User', avatar: '', initials: '??', email: '' },
            attachment: newMessage.attachment_url ? { name: newMessage.attachment_name, url: newMessage.attachment_url, type: newMessage.attachment_type } : undefined,
          };

          if (oldData && !oldData.some(m => m.id === mappedMessage.id)) {
            return [...oldData, mappedMessage];
          }
          return oldData;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
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
  }, [currentUser, selectedConversationId, queryClient, conversations]);

  useEffect(() => {
    const collaboratorToChat = (location.state as any)?.selectedCollaborator as Collaborator | undefined;
    if (collaboratorToChat && currentUser) {
      handleStartNewChat(collaboratorToChat);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, currentUser, navigate]);

  const handleSendMessage = async (text: string, attachment: Attachment | null) => {
    if (!selectedConversationId || !currentUser) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversationId,
        sender_id: currentUser.id,
        content: text,
        attachment_url: attachment?.url,
        attachment_name: attachment?.name,
        attachment_type: attachment?.type,
      });

    if (error) {
      toast.error("Failed to send message.", { description: error.message });
    }
  };

  const handleStartNewChat = async (collaborator: Collaborator) => {
    if (!currentUser) return;
    const { data, error } = await supabase.rpc('create_or_get_conversation', { p_other_user_id: collaborator.id, p_is_group: false });
    if (!error && data) {
      await fetchConversations();
      setSelectedConversationId(data as string);
    }
  };

  const handleStartNewGroupChat = async (members: Collaborator[], groupName: string) => {
    if (!currentUser) return;
    const { data, error } = await supabase.rpc('create_group_conversation', { p_group_name: groupName, p_participant_ids: members.map(m => m.id) });
    if (!error && data) {
      await fetchConversations();
      setSelectedConversationId(data as string);
    }
  };

  const handleClearChat = async (conversationId: string) => {
    const { error } = await supabase.from('messages').delete().eq('conversation_id', conversationId);
    if (error) toast.error("Failed to clear chat history.");
    else {
      toast.success("Chat history has been cleared.");
      queryClient.setQueryData(['messages', conversationId], []);
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
    }
  };

  const sendTyping = useCallback(() => {
    const channel = supabase.channel('chat-room');
    channel.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser?.id, conversationId: selectedConversationId } });
  }, [currentUser, selectedConversationId]);

  return {
    conversations: filteredConversations,
    selectedConversationId,
    setSelectedConversationId,
    isSomeoneTyping,
    isLoadingConversations,
    searchTerm,
    setSearchTerm,
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