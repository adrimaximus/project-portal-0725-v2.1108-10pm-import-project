import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import * as chatApi from '@/lib/chatApi';
import { Conversation, Message, Collaborator, Attachment, User } from '@/types';
import debounce from 'lodash.debounce';
import { v4 as uuidv4 } from 'uuid';
import { analyzeProjects } from '@/lib/openai';

interface ChatContextType {
  conversations: Omit<Conversation, 'messages'>[];
  isLoadingConversations: boolean;
  selectedConversation: Conversation | null;
  selectConversation: (id: string | null) => void;
  messages: Message[];
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  sendMessage: (text: string, attachment: Attachment | null) => void;
  startNewChat: (collaborator: Collaborator) => void;
  startNewGroupChat: (collaborators: Collaborator[], groupName: string) => void;
  deleteConversation: (conversationId: string) => void;
  leaveGroup: (conversationId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSomeoneTyping: boolean;
  sendTyping: () => void;
  refetchConversations: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const AI_ASSISTANT_USER: User = {
  id: 'ai-assistant',
  name: 'AI Assistant',
  initials: 'AI',
  avatar: '/ai-avatar.png', // Anda mungkin perlu menambahkan gambar avatar AI
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isSomeoneTyping, setIsSomeoneTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageSearchResults, setMessageSearchResults] = useState<string[]>([]);
  const [aiConversation, setAiConversation] = useState<Message[]>([
    {
      id: 'ai-initial-message',
      text: "You can ask me to create projects, add tasks, write articles, or find information. How can I help you today?",
      timestamp: new Date().toISOString(),
      sender: AI_ASSISTANT_USER,
    }
  ]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const typingTimerRef = useRef<number | null>(null);

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
    mutationFn: (variables: { text: string, attachment: Attachment | null }) => 
      chatApi.sendMessage({ conversationId: selectedConversationId!, senderId: currentUser!.id, ...variables }),
    onMutate: () => setIsSendingMessage(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.id] });
    },
    onError: (error: any) => toast.error("Failed to send message.", { description: error.message }),
    onSettled: () => setIsSendingMessage(false),
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

  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase.channel('chat-room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
        queryClient.invalidateQueries({ queryKey: ['messages', selectedConversationId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
      })
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (payload?.userId !== currentUser?.id && payload.conversationId === selectedConversationId) {
          setIsSomeoneTyping(true);
          if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
          typingTimerRef.current = window.setTimeout(() => setIsSomeoneTyping(false), 1500);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser, selectedConversationId, queryClient]);

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

  const handleAiSendMessage = async (text: string, attachment: Attachment | null) => {
    if (!currentUser) return;

    const userMessage: Message = {
      id: uuidv4(),
      text: text,
      timestamp: new Date().toISOString(),
      sender: currentUser,
      attachment: attachment || undefined,
    };

    setAiConversation(prev => [...prev, userMessage]);
    setIsSendingMessage(true);

    try {
      let aiPrompt = text;
      if (attachment) {
        aiPrompt += `\n\n(The user has attached a file named "${attachment.name}", but I cannot view its content. I should inform the user about this limitation if relevant to my response.)`;
      }

      const result = await analyzeProjects(aiPrompt, aiConversation.map(m => ({ sender: m.sender.id === currentUser.id ? 'user' : 'ai', content: m.text })));
      
      const successKeywords = ['done!', 'updated', 'created', 'changed', 'i\'ve made', 'deleted'];
      if (successKeywords.some(keyword => result.toLowerCase().includes(keyword))) {
        toast.info("Action successful. Refreshing data...");
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['projects'] }),
            queryClient.invalidateQueries({ queryKey: ['project'] }),
            queryClient.invalidateQueries({ queryKey: ['kb_articles'] }),
            queryClient.invalidateQueries({ queryKey: ['kb_article'] }),
            queryClient.invalidateQueries({ queryKey: ['kb_folders'] }),
            queryClient.invalidateQueries({ queryKey: ['goals'] }),
            queryClient.invalidateQueries({ queryKey: ['goal'] }),
        ]);
      }
  
      const aiMessage: Message = {
        id: uuidv4(),
        text: result,
        timestamp: new Date().toISOString(),
        sender: AI_ASSISTANT_USER,
      };
      setAiConversation(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: uuidv4(),
        text: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
        sender: AI_ASSISTANT_USER,
      };
      setAiConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const sendMessage = (text: string, attachment: Attachment | null) => {
    if (selectedConversationId === 'ai-assistant') {
      handleAiSendMessage(text, attachment);
    } else {
      sendMessageMutation.mutate({ text, attachment });
    }
  };

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    if (selectedConversationId === 'ai-assistant') {
      return {
        id: 'ai-assistant',
        userName: 'AI Assistant',
        userAvatar: AI_ASSISTANT_USER.avatar,
        isGroup: false,
        members: [currentUser!, AI_ASSISTANT_USER],
        messages: aiConversation,
        lastMessage: aiConversation[aiConversation.length - 1]?.text || "Ask me anything...",
        lastMessageTimestamp: aiConversation[aiConversation.length - 1]?.timestamp || new Date().toISOString(),
        unreadCount: 0,
      } as Conversation;
    }
    const conversation = conversations.find(c => c.id === selectedConversationId);
    return conversation ? { ...conversation, messages } : null;
  }, [selectedConversationId, conversations, messages, aiConversation, currentUser]);

  const value = {
    conversations: filteredConversations,
    isLoadingConversations,
    selectedConversation,
    selectConversation: setSelectedConversationId,
    messages,
    isLoadingMessages,
    isSendingMessage: isSendingMessage || sendMessageMutation.isPending,
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