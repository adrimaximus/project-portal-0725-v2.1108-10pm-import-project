import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as chatApi from '@/lib/chatApi';
import { Conversation, Message, Collaborator, Attachment } from '@/types';
import debounce from 'lodash.debounce';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  filteredConversations: Conversation[];
  messages: { [key: string]: Message[] };
  loading: boolean;
  error: Error | null;
  selectedConversation: Conversation | null;
  selectConversation: (conversationId: string | null) => void;
  sendMessage: (content: string, attachment?: File, replyTo?: Message) => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
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

  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.length > 2) {
        const results = await chatApi.searchMessages(term);
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
    const nameMatches = conversations.filter(c => c.name?.toLowerCase().includes(lowercasedSearchTerm));
    const messageMatches = conversations.filter(c => messageSearchResults.includes(c.id));
    
    const combined = new Map<string, Conversation>();
    nameMatches.forEach(c => combined.set(c.id, c));
    messageMatches.forEach(c => combined.set(c.id, c));
    
    return Array.from(combined.values()).sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
  }, [conversations, searchTerm, messageSearchResults]);

  const selectConversation = (conversationId: string | null) => {
    setSelectedConversationId(conversationId);
    if (conversationId && !messages[conversationId]) {
      chatApi.fetchMessages(conversationId).then(msgs => {
        setMessages(prev => ({ ...prev, [conversationId]: msgs }));
      });
    }
  };

  const sendMessage = async (content: string, file?: File, replyTo?: Message) => {
    if (!selectedConversationId || !user) return;

    let attachment: Attachment | undefined;
    if (file) {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
      attachment = {
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size,
      };
    }

    await chatApi.sendMessage(selectedConversationId, content, user.id, attachment, replyTo?.id);
    // Refetch messages for the current conversation
    const msgs = await chatApi.fetchMessages(selectedConversationId);
    setMessages(prev => ({ ...prev, [selectedConversationId]: msgs }));
    // Refetch conversations to update last message
    const convos = await chatApi.fetchConversations();
    setConversations(convos);
  };

  const selectedConversation = useMemo(() => {
    return conversations.find(c => c.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  return (
    <ChatContext.Provider value={{
      conversations,
      filteredConversations,
      messages,
      loading,
      error,
      selectedConversation,
      selectConversation,
      sendMessage,
      searchTerm,
      setSearchTerm,
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