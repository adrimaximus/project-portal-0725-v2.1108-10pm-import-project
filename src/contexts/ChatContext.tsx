import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import * as chatApi from '@/lib/chatApi';
import { Conversation, Message, Collaborator, Attachment } from '@/types';
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
  hasUnreadChat: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isSomeoneTyping, setIsSomeoneTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageSearchResults, setMessageSearchResults] = useState<string[]>([]);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const typingTimerRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase.channel('chat-room-realtime-listener')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as { conversation_id: string, sender_id: string };
          queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.id] });
          if (newMessage.conversation_id === selectedConversationId) {
            queryClient.invalidateQueries({ queryKey: ['messages', newMessage.conversation_id] });
          }
          if (newMessage.sender_id !== currentUser.id && location.pathname !== '/chat') {
            setHasUnreadChat(true);
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
        if (payload?.userId !== currentUser?.id && payload.conversationId === selectedConversationId) {
          setIsSomeoneTyping(true);
          if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
          typingTimerRef.current = window.setTimeout(() => setIsSomeoneTyping(false), 1500);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, selectedConversationId, queryClient, location.pathname]);

  useEffect(() => {
    if (location.pathname === '/chat') {
      setHasUnreadChat(false);
    }
  }, [location.pathname]);

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

  const value = {
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
    hasUnreadChat,
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