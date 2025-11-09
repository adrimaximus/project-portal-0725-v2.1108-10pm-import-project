import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Message } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface ChatContextType {
  // State
  replyingTo: Message | null;
  editingMessage: Message | null;
  forwardingMessage: Message | null;
  
  // Actions
  setReplyingTo: (message: Message | null) => void;
  setEditingMessage: (message: Message | null) => void;
  openForwardDialog: (message: Message) => void;
  setForwardingMessage: (message: Message | null) => void;
  
  // API Calls
  sendMessage: (text: string, conversationId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);

  const openForwardDialog = (message: Message) => setForwardingMessage(message);

  const deleteMessage = async (messageId: string) => {
    // Using soft delete for better user experience
    const { error } = await supabase.rpc('soft_delete_message', { p_message_id: messageId });

    if (error) {
      toast.error(`Failed to delete message: ${error.message}`);
    } else {
      toast.success("Message deleted.");
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    // This is a placeholder for your actual reaction logic
    console.log(`Toggling reaction ${emoji} for message ${messageId} by user ${user.id}`);
    toast.info("Reaction toggled (placeholder).");
  };

  const sendMessage = async (text: string, conversationId: string) => {
    if (!user || !text.trim()) return;

    if (editingMessage) {
      // UPDATE logic
      const { error } = await supabase
        .from('messages')
        .update({ content: text.trim() })
        .eq('id', editingMessage.id);

      if (error) {
        toast.error(`Failed to edit message: ${error.message}`);
      } else {
        toast.success("Message updated.");
      }
      setEditingMessage(null);
    } else {
      // CREATE logic
      const { error } = await supabase.from('messages').insert({
        content: text.trim(),
        sender_id: user.id,
        conversation_id: conversationId,
        reply_to_message_id: replyingTo?.id,
      });
      if (error) {
        toast.error(`Failed to send message: ${error.message}`);
      }
      setReplyingTo(null);
    }
  };

  const value = {
    replyingTo,
    setReplyingTo,
    editingMessage,
    setEditingMessage,
    forwardingMessage,
    setForwardingMessage,
    openForwardDialog,
    sendMessage,
    deleteMessage,
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