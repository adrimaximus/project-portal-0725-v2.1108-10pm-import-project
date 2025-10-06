import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { Message, Attachment, User } from '@/types';
import { analyzeProjects } from '@/lib/openai';

const AI_ASSISTANT_USER: User = {
  id: 'ai-assistant',
  name: 'AI Assistant',
  initials: 'AI',
  avatar_url: '/ai-avatar.png',
  email: 'ai@assistant.com'
};

const initialMessage: Message = {
  id: 'ai-initial-message',
  conversation_id: 'ai-assistant',
  sender: AI_ASSISTANT_USER,
  text: "You can ask me to create projects, add tasks, write articles, or find information. How can I help you today?",
  timestamp: new Date().toISOString(),
  message_type: 'user',
};

const useAiChat = () => {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<Message[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (data) {
        const historyMessages: Message[] = data.map(dbMsg => ({
          id: dbMsg.id,
          conversation_id: 'ai-assistant',
          text: dbMsg.content,
          timestamp: dbMsg.created_at,
          sender: dbMsg.sender === 'user' ? user as User : AI_ASSISTANT_USER,
          message_type: 'user',
        }));
        setConversation([initialMessage, ...historyMessages]);
      }
    };
    fetchHistory();
  }, [user]);

  const sendMessage = useCallback(async (text: string, attachmentFile?: File, repliedMsg?: Message) => {
    if (!user) return;

    const repliedMessage = repliedMsg ? {
      content: repliedMsg.text,
      senderName: repliedMsg.sender.name,
      isDeleted: repliedMsg.is_deleted || false,
    } : undefined;

    const userMessage: Message = {
      id: uuidv4(),
      conversation_id: 'ai-assistant',
      sender: user,
      text,
      timestamp: new Date().toISOString(),
      message_type: 'user',
      repliedMessage,
    };

    setConversation(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      await supabase.from('ai_chat_history').insert({
        id: userMessage.id,
        user_id: user.id,
        sender: 'user',
        content: text,
        reply_to_message_id: repliedMsg?.id,
      });

      const response = await analyzeProjects(text);
      
      const aiMessage: Message = {
        id: uuidv4(),
        conversation_id: 'ai-assistant',
        sender: AI_ASSISTANT_USER,
        text: response,
        timestamp: new Date().toISOString(),
        message_type: 'user',
      };

      setConversation(prev => [...prev, aiMessage]);

      await supabase.from('ai_chat_history').insert({
        id: aiMessage.id,
        user_id: user.id,
        sender: 'ai',
        content: response,
        reply_to_message_id: userMessage.id,
      });

    } catch (error: any) {
      console.error("AI chat error:", error);
      const errorMessage: Message = {
        id: uuidv4(),
        conversation_id: 'ai-assistant',
        sender: AI_ASSISTANT_USER,
        text: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
        message_type: 'user',
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return { conversation, sendMessage, isLoading };
};

export default useAiChat;