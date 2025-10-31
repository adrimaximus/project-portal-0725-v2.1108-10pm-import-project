import { Message, Conversation } from '@/types';
import { createContext, useContext, useState, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface ForwardDialogState {
  isOpen: boolean;
  message: Message | null;
}

interface ChatContextType {
  activeConversation: Conversation | null;
  setActiveConversation: (conversation: Conversation | null) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  forwardDialogState: ForwardDialogState;
  openForwardDialog: (message: Message) => void;
  closeForwardDialog: () => void;
  forwardMessage: (targetConversationIds: string[]) => Promise<void>;
  messageInputRef: React.RefObject<HTMLTextAreaElement>;
  focusInput: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [forwardDialogState, setForwardDialogState] = useState<ForwardDialogState>({ isOpen: false, message: null });
  const queryClient = useQueryClient();
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const focusInput = () => {
    setTimeout(() => messageInputRef.current?.focus(), 50);
  };

  const deleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase.rpc('soft_delete_message', { p_message_id: messageId });
    if (error) {
      toast.error(`Failed to delete message: ${error.message}`);
    } else {
      toast.success("Message deleted.");
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ['messages', activeConversation.id] });
      }
    }
  }, [activeConversation, queryClient]);

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    const { error } = await supabase.rpc('toggle_message_reaction', { p_message_id: messageId, p_emoji: emoji });
    if (error) {
      toast.error(`Failed to react: ${error.message}`);
    } else {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (activeConversation) {
        queryClient.invalidateQueries({ queryKey: ['messages', activeConversation.id] });
      }
    }
  }, [activeConversation, queryClient]);

  const openForwardDialog = (message: Message) => {
    setForwardDialogState({ isOpen: true, message });
  };

  const closeForwardDialog = () => {
    setForwardDialogState({ isOpen: false, message: null });
  };

  const forwardMessage = async (targetConversationIds: string[]) => {
    const { message } = forwardDialogState;
    if (!message) return;

    const forwardPromises = targetConversationIds.map(convoId =>
      supabase.from('messages').insert({
        conversation_id: convoId,
        content: message.content,
        attachment_url: message.attachment_url,
        attachment_name: message.attachment_name,
        attachment_type: message.attachment_type,
        is_forwarded: true,
      })
    );

    try {
      await Promise.all(forwardPromises);
      toast.success(`Message forwarded to ${targetConversationIds.length} conversation(s).`);
      closeForwardDialog();
    } catch (error: any) {
      toast.error(`Failed to forward message: ${error.message}`);
    }
  };

  const value = {
    activeConversation,
    setActiveConversation,
    deleteMessage,
    toggleReaction,
    forwardDialogState,
    openForwardDialog,
    closeForwardDialog,
    forwardMessage,
    messageInputRef,
    focusInput,
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