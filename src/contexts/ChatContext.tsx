import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import * as chatApi from '@/lib/chatApi';
import * as chatRealtime from '@/lib/chatRealtime';
import { Conversation, Message, Collaborator, Attachment, Reaction } from '@/types';
import debounce from 'lodash.debounce';

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
  });

  const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => chatApi.fetchMessages(selectedConversationId!),
    enabled: !!selectedConversationId && selectedConversationId !== 'ai-assistant',
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
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      let attachmentType: string | null = null;

      if (variables.attachmentFile && currentUser && selectedConversationId) {
        const file = variables.attachmentFile;
        const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = `chat-uploads/${currentUser.id}/${selectedConversationId}/${Date.now()}-${sanitizedFileName}`;
        const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, file);
        if (uploadError) throw new Error(`Failed to upload attachment: ${uploadError.message}`);
        
        const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
        attachmentUrl = urlData.publicUrl;
        attachmentName = file.name;
        attachmentType = file.type;
      }
      
      return chatRealtime.sendHybridMessage({ 
        conversationId: selectedConversationId!, 
        senderId: currentUser!.id, 
        text: variables.text, 
        attachmentUrl,
        attachmentName,
        attachmentType,
        replyToMessageId: variables.replyToMessageId,
      });
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
    if (!currentUser || !selectedConversationId || selectedConversationId === 'ai-assistant') return;

    const unsubscribe = chatRealtime.subscribeToConversation({
      conversationId: selectedConversationId,
      onNewMessage: (newMessagePayload) => {
        if (newMessagePayload.is_broadcast && newMessagePayload.sender_id === currentUser.id) {
          return;
        }

        const currentConversation = conversations.find(c => c.id === selectedConversationId);
        if (!currentConversation) {
            console.warn("Received message for a conversation not in the current list.");
            return;
        };

        const sender = currentConversation.members.find(m => m.id === newMessagePayload.sender_id);
        if (!sender) {
            console.warn("Received a message from an unknown sender in this conversation.", newMessagePayload.sender_id);
            queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
            return;
        }

        const formattedMessage: Message = {
            id: newMessagePayload.id,
            text: newMessagePayload.content,
            timestamp: newMessagePayload.created_at,
            sender: sender,
            attachment: newMessagePayload.attachment_url ? {
                name: newMessagePayload.attachment_name,
                url: newMessagePayload.attachment_url,
                type: newMessagePayload.attachment_type,
            } : undefined,
            reply_to_message_id: newMessagePayload.reply_to_message_id,
            reactions: [],
        };

        queryClient.setQueryData<Message[]>(['messages', selectedConversationId], (oldMessages) => {
          if (!oldMessages) return [formattedMessage];
          if (oldMessages.some(m => m.id === formattedMessage.id)) {
            return oldMessages;
          }
          return [...oldMessages, formattedMessage];
        });
        queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
      },
    });

    return () => unsubscribe();
  }, [currentUser, selectedConversationId, queryClient, conversations]);

  useEffect(() => {
    const collaboratorToChat = (location.state as any)?.selectedCollaborator as Collaborator | undefined;
    if (collaboratorToChat) {
      startNewChatMutation.mutate(collaboratorToChat);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, startNewChatMutation]);

  const sendTyping = useCallback(() => {
    if (selectedConversationId === 'ai-assistant') return;
    const channel = supabase.channel(`conversation:${selectedConversationId}`);
    channel.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUser?.id } });
  }, [currentUser, selectedConversationId]);

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    if (selectedConversationId === 'ai-assistant') {
      return { id: 'ai-assistant' } as Conversation;
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