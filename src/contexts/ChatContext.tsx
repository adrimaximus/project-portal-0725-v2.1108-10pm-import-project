import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import * as chatApi from '@/lib/chatApi';
import { Conversation, Message, Collaborator, Reaction, User } from '@/types/index';
import debounce from 'lodash.debounce';
import { ForwardMessageDialog } from '@/components/ForwardMessageDialog';
import { v4 as uuidv4 } from 'uuid';
import { sendHybridMessage, subscribeToConversation } from '@/lib/chatRealtime';

const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

interface ChatContextType {
  conversations: Omit<Conversation, 'messages'>[];
  isLoadingConversations: boolean;
  selectedConversation: Conversation | null;
  selectedConversationId: string | null;
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
  isChatPageActive: boolean;
  setIsChatPageActive: (isActive: boolean) => void;
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
  const [isChatPageActive, setIsChatPageActive] = useState(false);
  const isChatPageActiveRef = useRef(isChatPageActive);
  const recentlyProcessedIds = useRef(new Set<string>());
  
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    isChatPageActiveRef.current = isChatPageActive;
  }, [isChatPageActive]);

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
    if (!currentUser || conversations.length === 0) return;

    const playSound = async () => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', currentUser.id)
          .single();
        
        const prefs = profileData?.notification_preferences || {};
        const isCommentEnabled = prefs.comment !== false;
        const tone = prefs.tone;

        if (isCommentEnabled && tone && tone !== 'none') {
          const audio = new Audio(`${TONE_BASE_URL}${tone}`);
          await audio.play();
        }
      } catch (err) {
        console.warn("Could not play chat notification sound:", err);
      }
    };

    const subscriptions = conversations.map(convo => {
      return subscribeToConversation({
        conversationId: convo.id,
        onNewMessage: (message) => {
          if (recentlyProcessedIds.current.has(message.id)) {
            return;
          }
          recentlyProcessedIds.current.add(message.id);
          setTimeout(() => recentlyProcessedIds.current.delete(message.id), 2000);

          queryClient.invalidateQueries({ queryKey: ['messages', convo.id] });
          queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });

          const isFromAnotherUser = message.sender_id !== currentUser.id;
          const isChatActiveAndVisible = isChatPageActiveRef.current && selectedConversationIdRef.current === convo.id;

          if (isFromAnotherUser && !isChatActiveAndVisible) {
            playSound();
            setUnreadConversationIds(prev => new Set(prev).add(convo.id));
          }
        },
      });
    });

    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
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
    mutationFn: async (variables: { messageId: string, text: string, attachmentFile: File | null, replyToMessageId?: string | null }) => {
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      let attachmentType: string | null = null;

      if (variables.attachmentFile && currentUser && selectedConversationId) {
        const file = variables.attachmentFile;
        const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = `${selectedConversationId}/${uuidv4()}-${sanitizedFileName}`;
        const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, file);
        if (uploadError) throw new Error(`Failed to upload attachment: ${uploadError.message}`);
        
        const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
        attachmentUrl = urlData.publicUrl;
        attachmentName = file.name;
        attachmentType = file.type;
      }
      
      await sendHybridMessage({
        messageId: variables.messageId,
        conversationId: selectedConversationId!,
        senderId: currentUser!.id,
        text: variables.text,
        attachmentUrl,
        attachmentName,
        attachmentType,
        replyToMessageId: variables.replyToMessageId,
      });
    },
    onMutate: async (newMessageData) => {
      if (!currentUser || !selectedConversationId) return;

      await queryClient.cancelQueries({ queryKey: ['messages', selectedConversationId] });
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', selectedConversationId]);

      queryClient.setQueryData<Message[]>(['messages', selectedConversationId], (old) => {
        const optimisticMessage: Message = {
          id: newMessageData.messageId,
          text: newMessageData.text,
          timestamp: new Date().toISOString(),
          sender: currentUser,
          attachment: newMessageData.attachmentFile ? {
            name: newMessageData.attachmentFile.name,
            url: URL.createObjectURL(newMessageData.attachmentFile),
            type: newMessageData.attachmentFile.type,
          } : undefined,
          reply_to_message_id: newMessageData.replyToMessageId,
        };
        
        if (newMessageData.replyToMessageId) {
            const repliedMsg = (previousMessages || []).find(m => m.id === newMessageData.replyToMessageId);
            if (repliedMsg) {
                optimisticMessage.repliedMessage = {
                    content: repliedMsg.text,
                    senderName: repliedMsg.sender.name,
                    isDeleted: false,
                    attachment: repliedMsg.attachment,
                };
            }
        }

        return [...(old || []), optimisticMessage];
      });

      return { previousMessages };
    },
    onError: (err: any, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', selectedConversationId], context.previousMessages);
      }
      toast.error("Failed to send message.", { description: err.message });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
    },
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

  const toggleReactionMutation = useMutation<
    void,
    Error,
    { messageId: string; emoji: string },
    { previousDataMap: Map<any[], any> }
  >({
    mutationFn: async ({ messageId, emoji }) => {
      if (!user) throw new Error("User not authenticated");
      return chatApi.toggleReaction(messageId, emoji, user.id);
    },
    onMutate: async ({ messageId, emoji }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', selectedConversationId] });
      await queryClient.cancelQueries({ queryKey: ['project'] });
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousDataMap = new Map();
      if (!currentUser) return { previousDataMap };

      const optimisticallyUpdateReactions = (data: any) => {
        if (!data) return data;

        const updateMessageReactions = (message: Message): Message => {
          if (message.id === messageId) {
            const newReactions: Reaction[] = message.reactions ? [...message.reactions] : [];
            const existingReactionIndex = newReactions.findIndex(r => r.user_id === currentUser!.id);

            if (existingReactionIndex > -1) {
              const existingReaction = newReactions[existingReactionIndex];
              if (existingReaction.emoji === emoji) {
                newReactions.splice(existingReactionIndex, 1);
              } else {
                newReactions[existingReactionIndex] = { ...existingReaction, emoji };
              }
            } else {
              newReactions.push({
                id: uuidv4(),
                emoji,
                user_id: currentUser!.id,
                user_name: currentUser!.name || '',
              });
            }
            return { ...message, reactions: newReactions };
          }
          return message;
        };

        if (Array.isArray(data) && data.length > 0 && 'sender' in data[0]) { // Message[]
          return data.map(updateMessageReactions);
        }
        if (Array.isArray(data) && data.length > 0 && 'comments' in data[0]) { // Project[]
          return data.map(project => ({
            ...project,
            comments: (project.comments || []).map(updateMessageReactions)
          }));
        }
        if (data.comments && Array.isArray(data.comments)) { // Single Project
          return {
            ...data,
            comments: data.comments.map(updateMessageReactions),
          };
        }
        return data;
      };

      const queryCache = queryClient.getQueryCache();
      const relevantQueryKeys = queryCache.findAll()
        .map(q => q.queryKey)
        .filter(key => ['messages', 'project', 'projects', 'tasks'].includes(key[0] as string));

      for (const queryKey of relevantQueryKeys) {
        const previousData = queryClient.getQueryData(queryKey);
        if (previousData) {
          previousDataMap.set(queryKey, previousData);
          const updatedData = optimisticallyUpdateReactions(previousData);
          queryClient.setQueryData(queryKey, updatedData);
        }
      }

      return { previousDataMap };
    },
    onError: (err, variables, context) => {
      if (context?.previousDataMap) {
        for (const [queryKey, previousData] of context.previousDataMap.entries()) {
          queryClient.setQueryData(queryKey, previousData);
        }
      }
      toast.error("Failed to update reaction.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
    const messageId = uuidv4();
    sendMessageMutation.mutate({ messageId, text, attachmentFile, replyToMessageId });
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
    selectedConversationId,
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
    isChatPageActive,
    setIsChatPageActive,
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