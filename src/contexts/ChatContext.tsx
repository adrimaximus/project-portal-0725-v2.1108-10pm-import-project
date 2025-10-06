import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as chatApi from '@/lib/chatApi';
import { Conversation, Message, Collaborator, Attachment } from '@/types';
import debounce from 'lodash.debounce';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface ChatContextType {
  conversations: Omit<Conversation, 'messages' | 'unreadCount'>[];
  filteredConversations: Omit<Conversation, 'messages' | 'unreadCount'>[];
  selectedConversation: Conversation | null;
  selectConversation: (id: string | null) => void;
  loading: boolean;
  error: Error | null;
  sendMessage: (text: string, attachmentFile?: File, replyTo?: Message) => Promise<void>;
  isSendingMessage: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  deleteConversation: (id: string) => Promise<void>;
  updateGroupDetails: (id: string, name: string, avatarUrl: string | null) => Promise<void>;
  addMembersToGroup: (id: string, userIds: string[]) => Promise<void>;
  removeMemberFromGroup: (id: string, userId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Omit<Conversation, 'messages' | 'unreadCount'>[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageSearchResults, setMessageSearchResults] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      chatApi.fetchConversations()
        .then(setConversations)
        .catch(setError)
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversationId && selectedConversationId !== 'ai-assistant') {
      chatApi.fetchMessages(selectedConversationId)
        .then(setMessages)
        .catch(console.error);
    } else {
      setMessages([]);
    }
  }, [selectedConversationId]);

  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.length > 2) {
        const results = await chatApi.searchConversationsByMessage(term);
        setMessageSearchResults(results);
      } else {
        setMessageSearchResults([]);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const nameMatches = conversations.filter(c => c.userName.toLowerCase().includes(lowercasedSearchTerm));
    const messageMatches = conversations.filter(c => messageSearchResults.includes(c.id));
    const combined = new Map(nameMatches.map(c => [c.id, c]));
    messageMatches.forEach(c => combined.set(c.id, c));
    return Array.from(combined.values()).sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
  }, [conversations, searchTerm, messageSearchResults]);

  const sendMessage = async (text: string, attachmentFile?: File, replyTo?: Message) => {
    if (!user || !selectedConversationId) return;
    setIsSendingMessage(true);

    let attachment: Attachment | undefined;
    let attachment_url: string | undefined;

    if (attachmentFile) {
      const filePath = `chat-attachments/${selectedConversationId}/${Date.now()}-${attachmentFile.name}`;
      const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, attachmentFile);
      if (uploadError) {
        console.error('Upload error:', uploadError);
        setIsSendingMessage(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
      attachment_url = urlData.publicUrl;
      attachment = {
        name: attachmentFile.name,
        url: attachment_url,
        type: attachmentFile.type,
        size: attachmentFile.size,
      };
    }

    const messageData = {
      conversation_id: selectedConversationId,
      sender_id: user.id,
      content: text,
      attachment_url,
      attachment_name: attachment?.name,
      attachment_type: attachment?.type,
      reply_to_message_id: replyTo?.id,
    };

    const { data, error: insertError } = await supabase.from('messages').insert(messageData).select().single();

    if (insertError) {
      console.error('Send message error:', insertError);
    } else if (data) {
      // This part is for optimistic update, but for now we rely on subscription
    }

    setIsSendingMessage(false);
  };

  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.conversation_id === selectedConversationId) {
          chatApi.fetchMessages(selectedConversationId).then(setMessages);
        }
        chatApi.fetchConversations().then(setConversations);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId]);

  const selectConversation = (id: string | null) => {
    setSelectedConversationId(id);
  };

  const selectedConversation = useMemo((): Conversation | null => {
    if (!selectedConversationId) return null;
    if (selectedConversationId === 'ai-assistant') {
      return { id: 'ai-assistant' } as unknown as Conversation; // Return a shell object
    }
    const conversation = conversations.find(c => c.id === selectedConversationId);
    return conversation ? { ...conversation, messages, unreadCount: 0 } : null;
  }, [selectedConversationId, conversations, messages]);

  const deleteConversation = async (id: string) => {
    // Implement delete logic
  };
  const updateGroupDetails = async (id: string, name: string, avatarUrl: string | null) => {
    // Implement update logic
  };
  const addMembersToGroup = async (id: string, userIds: string[]) => {
    // Implement add members logic
  };
  const removeMemberFromGroup = async (id: string, userId: string) => {
    // Implement remove member logic
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      filteredConversations,
      selectedConversation,
      selectConversation,
      loading,
      error,
      sendMessage,
      isSendingMessage,
      searchTerm,
      setSearchTerm,
      deleteConversation,
      updateGroupDetails,
      addMembersToGroup,
      removeMemberFromGroup,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};