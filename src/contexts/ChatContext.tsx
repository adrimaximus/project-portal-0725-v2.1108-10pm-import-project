import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import * as chatApi from '@/lib/chatApi';
import * as chatRealtime from '@/lib/chatRealtime';
import { Conversation, Message, Collaborator, Reaction } from '@/types';
import debounce from 'lodash.debounce';
import { ForwardMessageDialog } from '@/components/ForwardMessageDialog';

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
  deleteMessage: (messageId: string) => void;
  leaveGroup: (conversationId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSomeoneTyping: boolean;
  sendTyping: () => void;
  refetchConversations: () => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  unreadConversationIds: Set<string>;
  openForwardDialog: (message: Message) => void;
  forwardMessage: (args: { message: Message; targetConversationIds: string[] }) => void;
  isForwarding: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const [isSomeoneTyping, setIsSomeoneTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageSearchResults, setMessageSearchResults] = useState<string[]>([]);
  const [unreadConversationIds, setUnreadConversationIds] = useState(new Set<string>());
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const { data: conversations = [], isLoading: isLoadingConversations, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations', currentUser?.id],
    queryFn: chatApi.fetchConversations,
    enabled: !!currentUser,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedConversationId],
    queryFn: () => chatApi.fetchMessages(selectedConversationId!),
    enabled: !!selectedConversationId && selectedConversationId !== 'ai-assistant',
  });

  useEffect(() => {
    if (!currentUser) return;

    const handlePostgresChange = (payload: any) => {
      const conversationId = payload.new.conversation_id;
      const isRelevant = conversations.some(c => c.id === conversationId);

      if (isRelevant) {
        queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });

        if (payload.eventType === 'INSERT' && payload.new.sender_id !== currentUser.id) {
          if (selectedConversationIdRef.current !== conversationId) {
            setUnreadConversationIds(prev => new Set(prev).add(conversationId));
          }
        }
      }
    };

    const messagesChannel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        handlePostgresChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUser, conversations, queryClient]);

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
      let attachment: { url: string, name: string, type: string } | null = null;

      if (variables.attachmentFile && currentUser && selectedConversationId) {
        const file = variables.attachmentFile;
        const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = `chat-uploads/${currentUser.id}/${selectedConversationId}/${Date.now()}-${sanitizedFileName}`;
        const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, file);
        if (uploadError) throw new Error(`Failed to upload attachment: ${uploadError.message}`);
        
        const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
        attachment = { url: urlData.publicUrl, name: file.name, type: file.type };
      }
      
      const data = await chatApi.sendMessage({
        conversationId: selectedConversationId!,
        senderId: currentUser!.id,
        text: variables.text,
        attachment,
        replyToMessageId: variables.replyToMessageId,
      });
      return data;
    },
    onSuccess: (data) => {
      // Fire and forget the WhatsApp notification
      supabase.functions.invoke('send-wbiztool-message', {
        body: { 
          conversation_id: selectedConversationId,
          message_id: data.id
        }
      }).catch(err => console.error("Failed to trigger WhatsApp notification:", err));
    },
    onError: (error: any) => toast.error("Failed to send message.", { description: error.message }),
  });

  const forwardMessageMutation = useMutation({
    mutationFn: async ({ message, targetConversationIds }: { message: Message, targetConversationIds: string[] }) => {
      if (!currentUser) throw new Error("User not authenticated");

      const messagesToInsert = targetConversationIds.map(conversationId => ({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: message.text,
        attachment_url: message.attachment?.url,
        attachment_name: message.attachment?.name,
        attachment_type: message.attachment?.type,
        is_forwarded: true,
      }));

      const { error } = await supabase.from('messages').insert(messagesToInsert);
      if (error) throw error;

      return { targetConversationIds };
    },
    onSuccess: ({ targetConversationIds }) => {
      toast.success(`Message forwarded to ${targetConversationIds.length} chat(s).`);
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
      targetConversationIds.forEach(id => {
        queryClient.invalidateQueries({ queryKey: ['messages', id] });
      });
      setMessageToForward(null);
    },
    onError: (error: any) => {
      toast.error("Failed to forward message.", { description: error.message });
    },
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

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase.rpc('soft_delete_message', { p_message_id: messageId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message deleted.");
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
    },
    onError: (error: any) => {
      toast.error("Failed to delete message.", { description: error.message });
    }
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
              newReactions = [...(message.reactions || []), { emoji, user_id: currentUser!.id, user_name: currentUser!.name || '' }];
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

  const selectConversation = (id: string | null) => {
    setSelectedConversationId(id);
    if (id) {
      setUnreadConversationIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const value: ChatContextType = {
    conversations: filteredConversations,
    isLoadingConversations,
    selectedConversation,
    selectConversation,
    messages,
    isLoadingMessages,
    isSendingMessage: sendMessageMutation.isPending,
    sendMessage,
    startNewChat: startNewChatMutation.mutate,
    startNewGroupChat: (collaborators: Collaborator[], groupName: string) => startNewGroupChatMutation.mutate({ members: collaborators, groupName }),
    deleteConversation: deleteConversationMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,
    leaveGroup: leaveGroupMutation.mutate,
    searchTerm,
    setSearchTerm,
    isSomeoneTyping,
    sendTyping,
    refetchConversations,
    toggleReaction,
    unreadConversationIds,
    openForwardDialog: setMessageToForward,
    forwardMessage: forwardMessageMutation.mutate,
    isForwarding: forwardMessageMutation.isPending,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
      <ForwardMessageDialog
        message={messageToForward}
        isOpen={!!messageToForward}
        onClose={() => setMessageToForward(null)}
      />
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};