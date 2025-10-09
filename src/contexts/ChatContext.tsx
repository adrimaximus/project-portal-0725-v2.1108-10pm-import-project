import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, useMutation, InfiniteData, UseMutateFunction } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import * as chatApi from '@/lib/chatApi';
import { Conversation, Message, Collaborator, Attachment, Reaction } from '@/types';
import debounce from 'lodash.debounce';
import { v4 as uuidv4 } from 'uuid';

interface ChatContextType {
  conversations: Omit<Conversation, 'messages'>[];
  isLoadingConversations: boolean;
  selectedConversation: Conversation | null;
  selectConversation: (id: string | null) => void;
  messages: Message[];
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  sendMessage: (text: string, attachmentFile: File | null, replyToMessageId?: string | null) => void;
  startNewChat: (collaborator: Collaborator) => void;
  startNewGroupChat: (collaborators: Collaborator[], groupName: string) => void;
  deleteConversation: (conversationId: string) => void;
  leaveGroup: (conversationId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSomeoneTyping: boolean;
  sendTyping: () => void;
  refetchConversations: () => void;
  toggleReaction: (messageId: string, emoji: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const [isSomeoneTyping, setIsSomeoneTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageSearchResults, setMessageSearchResults] = useState<string[]>([]);
  
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const typingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const { data: conversations = [], isLoading: isLoadingConversations, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', currentUser?.id],
    queryFn: chatApi.fetchConversations,
    enabled: !!currentUser,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => chatApi.fetchMessages(selectedConversationId!),
    enabled: !!selectedConversationId && selectedConversationId !== 'ai-assistant',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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
    const combined = new Map(nameMatches.map(c => [c.id, c]));
    messageMatches.forEach(c => combined.set(c.id, c));
    return Array.from(combined.values()).sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
  }, [conversations, searchTerm, messageSearchResults]);

  const sendMessageMutation = useMutation({
    mutationFn: async (variables: { text: string, attachmentFile: File | null, replyToMessageId?: string | null }) => {
      let attachment: Attachment | null = null;
      if (variables.attachmentFile && currentUser && selectedConversationId) {
        const file = variables.attachmentFile;
        const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = `chat-uploads/${currentUser.id}/${selectedConversationId}/${uuidv4()}-${sanitizedFileName}`;
        const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, file);
        if (uploadError) throw new Error(`Failed to upload attachment: ${uploadError.message}`);
        
        const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
        attachment = {
          name: file.name,
          url: urlData.publicUrl,
          type: file.type,
        };
      }
      
      return chatApi.sendMessage({ 
        conversationId: selectedConversationId!, 
        senderId: currentUser!.id, 
        text: variables.text, 
        attachment,
        replyToMessageId: variables.replyToMessageId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
    },
    onError: (error: any) => toast.error("Failed to send message.", { description: error.message }),
  });

  const startNewChatMutation = useMutation({
    mutationFn: (collaborator: Collaborator) => chatApi.createOrGetConversation(collaborator.id),
    onSuccess: (conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
      setSelectedConversationId(conversationId);
    },
  });

  const startNewGroupChatMutation = useMutation({
    mutationFn: (variables: { members: Collaborator[], groupName: string }) => 
      chatApi.createGroupConversation(variables.groupName, variables.members.map(m => m.id)),
    onSuccess: (conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
      setSelectedConversationId(conversationId);
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (conversationId: string) => chatApi.hideConversation(conversationId),
    onSuccess: (_, conversationId) => {
      toast.success("Chat has been removed from your list.");
      if (selectedConversationId === conversationId) setSelectedConversationId(null);
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
    },
    onError: (error: any) => toast.error("Failed to delete chat.", { description: error.message }),
  });

  const leaveGroupMutation = useMutation({
    mutationFn: (conversationId: string) => chatApi.leaveGroup(conversationId),
    onSuccess: (_, conversationId) => {
      toast.success("You have left the group.");
      if (selectedConversationId === conversationId) setSelectedConversationId(null);
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
    },
    onError: (error: any) => toast.error("Failed to leave group.", { description: error.message }),
  });

  const toggleReactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string, emoji: string }) => {
      if (!currentUser) throw new Error("User not authenticated");
      return chatApi.toggleReaction(messageId, emoji, currentUser.id);
    },
    onMutate: async ({ messageId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', selectedConversationId] });
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', selectedConversationId]);

      queryClient.setQueryData<Message[]>(['messages', selectedConversationId], (old) => {
        if (!old) return [];
        return old.map(message => {
          if (message.id === messageId) {
            const existingReactionIndex = (message.reactions || []).findIndex(r => r.emoji === emoji && r.user_id === currentUser!.id);
            let newReactions: Reaction[];
            if (existingReactionIndex > -1) {
              newReactions = (message.reactions || []).filter((_, index) => index !== existingReactionIndex);
            } else {
              newReactions = [...(message.reactions || []), { emoji, user_id: currentUser!.id, user_name: currentUser!.name }];
            }
            return { ...message, reactions: newReactions };
          }
          return message;
        });
      });
      return { previousMessages };
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', selectedConversationId], context.previousMessages);
      }
      toast.error("Failed to update reaction.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
    },
  });

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('chat-room-realtime-listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          const changedMessage = payload.new as { conversation_id: string };
          queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
          if (changedMessage.conversation_id === selectedConversationIdRef.current) {
            queryClient.invalidateQueries({ queryKey: ['messages', changedMessage.conversation_id] });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        async (payload) => {
          const reaction = (payload.new || payload.old) as { message_id: string, user_id: string };
          if (reaction.user_id === currentUser.id) return;

          const { data: messageData } = await supabase
            .from('messages')
            .select('conversation_id')
            .eq('id', reaction.message_id)
            .single();

          if (messageData && messageData.conversation_id === selectedConversationIdRef.current) {
            queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationIdRef.current] });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
        }
      )
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload?.userId !== currentUser?.id && payload.conversationId === selectedConversationIdRef.current) {
          setIsSomeoneTyping(true);
          if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
          typingTimerRef.current = window.setTimeout(() => setIsSomeoneTyping(false), 1500);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, queryClient]);

  useEffect(() => {
    const collaboratorToChat = (location.state as any)?.selectedCollaborator as Collaborator | undefined;
    if (collaboratorToChat) {
      startNewChatMutation.mutate(collaboratorToChat);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, startNewChatMutation]);

  const sendTyping = useCallback(() => {
    if (selectedConversationId === 'ai-assistant') return;
    const channel = supabase.channel('chat-room');
    channel.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser?.id, conversationId: selectedConversationId } });
  }, [currentUser, selectedConversationId]);

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    if (selectedConversationId === 'ai-assistant') {
      return { id: 'ai-assistant' } as Conversation; // Return a shell object
    }
    const conversation = conversations.find(c => c.id === selectedConversationId);
    return conversation ? { ...conversation, messages } : null;
  }, [selectedConversationId, conversations, messages]);

  const sendMessage = (text: string, attachmentFile: File | null, replyToMessageId?: string | null) => {
    sendMessageMutation.mutate({ text, attachmentFile, replyToMessageId });
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    toggleReactionMutation.mutate({ messageId, emoji });
  };

  const value: ChatContextType = {
    conversations: filteredConversations,
    isLoadingConversations,
    selectedConversation,
    selectConversation: setSelectedConversationId,
    messages,
    isLoadingMessages,
    isSendingMessage: sendMessageMutation.isPending,
    sendMessage,
    startNewChat: startNewChatMutation.mutate,
    startNewGroupChat: (collaborators: Collaborator[], groupName: string) => startNewGroupChatMutation.mutate({ members: collaborators, groupName }),
    deleteConversation: deleteConversationMutation.mutate,
    leaveGroup: leaveGroupMutation.mutate,
    searchTerm,
    setSearchTerm,
    isSomeoneTyping,
    sendTyping,
    refetchConversations,
    toggleReaction,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};