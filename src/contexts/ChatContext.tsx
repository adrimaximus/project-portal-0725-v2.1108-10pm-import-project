import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

interface ChatContextType {
  deleteMessage: (messageId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  openForwardDialog: (message: Message) => void;
  
  editingMessage: Message | null;
  setEditingMessage: (message: Message | null) => void;
  editMessage: (messageId: string, newText: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  const deleteMessage = async (messageId: string) => {
    console.log('Deleting message', messageId);
    toast.success('Message deleted (placeholder).');
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    console.log('Toggling reaction', messageId, emoji);
  };

  const openForwardDialog = (message: Message) => {
    console.log('Forwarding message', message);
    toast.info('Forward functionality not implemented yet.');
  };

  const editMessage = async (messageId: string, newText: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ content: newText.trim() })
      .eq('id', messageId);
  
    if (error) {
      toast.error(`Failed to edit message: ${error.message}`);
    } else {
      toast.success("Message updated.");
    }
  };

  const value = {
    deleteMessage,
    toggleReaction,
    openForwardDialog,
    editingMessage,
    setEditingMessage,
    editMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};