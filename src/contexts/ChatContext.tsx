import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import * as chatApi from '@/lib/chatApi';
import { Conversation, Message, Collaborator, Reaction, User, Project, Task } from '@/types/index';
import debounce from 'lodash.debounce';
import { ForwardMessageDialog } from '@/components/ForwardMessageDialog';
import { v4 as uuidv4 } from 'uuid';
import { sendHybridMessage } from '@/lib/chatRealtime';

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
  sendMessage: (text: string, attachments: File[], replyToMessageId?: string | null) => void;
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
  editingMessage: Message | null;
  startEditingMessage: (message: Message) => void;
  cancelEditingMessage: () => void;
  editMessage: (messageId: string, newText: string) => void;
  isEditingMessage: boolean;
  projectSuggestions: Project[];
  taskSuggestions: Task[];
  billSuggestions: Project[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const DialogRenderer = ({ message, onClose }: { message: Message | null, onClose: () => void }) => {
  return (
    <ForwardMessageDialog
      message={message}
      isOpen={!!message}
      onClose={onClose}
    />
  );
};

const ChatProviderComponent = ({ children }: { children: ReactNode }) => {
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
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  
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

  const { data: userProjects = [] } = useQuery<Project[]>({
    queryKey: ['userProjectsForMentions', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, slug, payment_status, budget, status, created_by')
        .not('status', 'eq', 'Deleted')
        .order('updated_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching user projects for mentions:", error);
        return [];
      }
      return data as unknown as Project[];
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  const { data: userTasks = [] } = useQuery<Task[]>({
    queryKey: ['userTasksForMentions', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const { data, error } = await supabase.rpc('get_project_tasks', { p_limit: 500 });
      if (error) {
        console.error("Error fetching user tasks for mentions:", error);
        return [];
      }
      return data;
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
  });

  const userBills = useMemo(() => {
    return userProjects.filter(p => p.payment_status && p.budget);
  }, [userProjects]);

  const playSound = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', currentUser?.id)
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

  const handleIncomingMessage = (message: any) => {
    // Deduplicate messages received via broadcast vs DB insert
    if (recentlyProcessedIds.current.has(message.id)) {
      return;
    }
    recentlyProcessedIds.current.add(message.id);
    setTimeout(() => recentlyProcessedIds.current.delete(message.id), 2000);

    // If message belongs to active conversation, refresh messages
    if (selectedConversationIdRef.current === message.conversation_id) {
       queryClient.invalidateQueries({ queryKey: ['messages', message.conversation_id] });
    }

    // Always refresh conversations list to show new last message/timestamp
    queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });

    const isFromAnotherUser = message.sender_id !== currentUser?.id;
    const isChatActiveAndVisible = isChatPageActiveRef.current && selectedConversationIdRef.current === message.conversation_id;

    if (isFromAnotherUser && !isChatActiveAndVisible) {
      playSound();
      setUnreadConversationIds(prev => new Set(prev).add(message.conversation_id));
    }
  };

  // 1. Global subscription for persistent message updates (Background & List updates)
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel(`global-messages-listener:${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
           handleIncomingMessage(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, queryClient]);

  // 2. Active Conversation subscription for Broadcast events (Fast/Ephemeral)
  useEffect(() => {
    if (!selectedConversationId || selectedConversationId === 'ai-assistant') return;

    const channel = supabase.channel(`conversation:${selectedConversationId}`)
      .on('broadcast', { event: 'message' }, ({ payload }) => {
         handleIncomingMessage(payload);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
         // Typing indicators logic
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId, currentUser]);


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
    mutationFn: async (variables: { text: string, attachments: File[], replyToMessageId?: string | null }) => {
      if (!currentUser || !selectedConversationId) throw new Error("No conversation selected");

      const itemsToSend = [];
      
      if (variables.attachments.length === 0) {
        // Text only
        itemsToSend.push({ text: variables.text, file: null });
      } else {
        // Text with first file, then subsequent files
        variables.attachments.forEach((file, index) => {
          itemsToSend.push({
            text: index === 0 ? variables.text : '', // Attach text to first file only
            file
          });
        });
      }

      for (const item of itemsToSend) {
        let attachmentUrl: string | null = null;
        let attachmentName: string | null = null;
        let attachmentType: string | null = null;

        if (item.file) {
          const file = item.file;
          const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const filePath = `${selectedConversationId}/${uuidv4()}-${sanitizedFileName}`;
          const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, file);
          if (uploadError) throw new Error(`Failed to upload attachment: ${uploadError.message}`);
          
          const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
          attachmentUrl = urlData.publicUrl;
          attachmentName = file.name;
          attachmentType = file.type;
        }

        const messageId = uuidv4();
        await sendHybridMessage({
          messageId,
          conversationId: selectedConversationId,
          senderId: currentUser.id,
          text: item.text,
          attachmentUrl,
          attachmentName,
          attachmentType,
          replyToMessageId: variables.replyToMessageId,
        });
      }
    },
    onMutate: async (newMessageData) => {
      if (!currentUser || !selectedConversationId) return;

      await queryClient.cancelQueries({ queryKey: ['messages', selectedConversationId] });
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', selectedConversationId]);

      // Optimistic update for all items
      const optimisticMessages: Message[] = [];
      
      if (newMessageData.attachments.length === 0) {
        optimisticMessages.push({
          id: uuidv4(),
          text: newMessageData.text,
          timestamp: new Date().toISOString(),
          sender: currentUser,
          reply_to_message_id: newMessageData.replyToMessageId,
        });
      } else {
        newMessageData.attachments.forEach((file, index) => {
          optimisticMessages.push({
            id: uuidv4(),
            text: index === 0 ? newMessageData.text : '',
            timestamp: new Date().toISOString(),
            sender: currentUser,
            attachment: {
              name: file.name,
              url: URL.createObjectURL(file),
              type: file.type,
            },
            reply_to_message_id: newMessageData.replyToMessageId,
          });
        });
      }

      // Populate reply data for optimistic messages
      if (newMessageData.replyToMessageId) {
        const repliedMsg = (previousMessages || []).find(m => m.id === newMessageData.replyToMessageId);
        if (repliedMsg) {
          optimisticMessages.forEach(msg => {
             msg.repliedMessage = {
                content: repliedMsg.text,
                senderName: repliedMsg.sender.name,
                isDeleted: false,
                attachment: repliedMsg.attachment,
            };
          });
        }
      }

      queryClient.setQueryData<Message[]>(['messages', selectedConversationId], (old) => {
        return [...(old || []), ...optimisticMessages];
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
      if (!currentUser) throw new Error("User not authenticated");
      return chatApi.toggleReaction(messageId, emoji);
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

  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, newText }: { messageId: string, newText: string }) => {
      const { error } = await supabase
        .from('messages')
        .update({ content: newText, updated_at: new Date().toISOString() })
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message updated.");
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
    },
    onError: (error: any) => {
      toast.error("Failed to edit message.", { description: error.message });
    }
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

  const sendMessage = (text: string, attachments: File[], replyToMessageId?: string | null) => {
    sendMessageMutation.mutate({ text, attachments, replyToMessageId });
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

  const startEditingMessage = (message: Message) => {
    setEditingMessage(message);
  };

  const cancelEditingMessage = () => {
    setEditingMessage(null);
  };

  const editMessage = (messageId: string, newText: string) => {
    editMessageMutation.mutate({ messageId, newText });
    cancelEditingMessage();
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
    editingMessage,
    startEditingMessage,
    cancelEditingMessage,
    editMessage,
    isEditingMessage: editMessageMutation.isPending,
    projectSuggestions: userProjects,
    taskSuggestions: userTasks,
    billSuggestions: userBills,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
      <DialogRenderer message={messageToForward} onClose={() => setMessageToForward(null)} />
    </ChatContext.Provider>
  );
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  return <ChatProviderComponent>{children}</ChatProviderComponent>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};