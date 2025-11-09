import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Message } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatContextType {
  sendMessage: (content: string, attachment?: File) => Promise<void>;
  updateMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  
  editingMessage: Message | null;
  setEditingMessage: (message: Message | null) => void;
  replyingTo: Message | null;
  setReplyingTo: (message: Message | null) => void;

  openForwardDialog: (message: Message) => void;
  forwardMessage: Message | null;
  isForwardDialogOpen: boolean;
  setIsForwardDialogOpen: (isOpen: boolean) => void;
  
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [isForwardDialogOpen, setIsForwardDialogOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>('1'); // Default to a dummy conversation ID

  const sendMessage = async (content: string, attachment?: File) => {
    if (!currentConversationId) {
      toast.error("No active conversation selected.");
      return;
    }
    
    const { error } = await supabase.from('messages').insert({
      conversation_id: currentConversationId,
      content: content,
      reply_to_message_id: replyingTo?.id,
    });

    if (error) {
      toast.error(`Failed to send message: ${error.message}`);
    } else {
      setReplyingTo(null);
    }
  };

  const updateMessage = async (messageId: string, newContent: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ content: newContent })
      .eq('id', messageId);
  
    if (error) {
      toast.error(`Failed to edit message: ${error.message}`);
    } else {
      toast.success("Message updated.");
    }
    setEditingMessage(null);
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase.rpc('soft_delete_message', { p_message_id: messageId });
    if (error) {
      toast.error(`Failed to delete message: ${error.message}`);
    } else {
      toast.success("Message deleted.");
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    await supabase.rpc('toggle_message_reaction', { p_message_id: messageId, p_emoji: emoji });
  };

  const openForwardDialog = (message: Message) => {
    setForwardMessage(message);
    setIsForwardDialogOpen(true);
  };

  const value = {
    sendMessage,
    updateMessage,
    deleteMessage,
    toggleReaction,
    editingMessage,
    setEditingMessage,
    replyingTo,
    setReplyingTo,
    openForwardDialog,
    forwardMessage,
    isForwardDialogOpen,
    setIsForwardDialogOpen,
    currentConversationId,
    setCurrentConversationId,
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