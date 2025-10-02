import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { Message, Attachment, User } from '@/types';
import { analyzeProjects } from '@/lib/openai';
import { useQuery } from '@tanstack/react-query';

const AI_ASSISTANT_USER: User = {
  id: 'ai-assistant',
  name: 'AI Assistant',
  initials: 'AI',
  avatar_url: '/ai-avatar.png',
  email: 'ai@assistant.com',
};

const useAiChat = (currentUser: User | null) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'ai-initial-message',
      content: "You can ask me to create projects, add tasks, write articles, or find information. How can I help you today?",
      timestamp: new Date().toISOString(),
      sender: AI_ASSISTANT_USER,
    } as Message,
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: dbMessages, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['ai_chat_history', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data.map(dbMsg => ({
        id: dbMsg.id,
        content: dbMsg.content,
        timestamp: dbMsg.created_at,
        sender: dbMsg.sender === 'user' ? currentUser : AI_ASSISTANT_USER,
        reply_to_message_id: dbMsg.reply_to_message_id,
      } as Message));
    },
    enabled: !!currentUser,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (dbMessages && dbMessages.length > 0) {
      const messagesWithReplies = dbMessages.map(msg => {
        if (msg.reply_to_message_id) {
            const repliedMsg = dbMessages.find(m => m.id === msg.reply_to_message_id);
            if (repliedMsg) {
                return {
                    ...msg,
                    repliedMessage: {
                        content: repliedMsg.content,
                        senderName: repliedMsg.sender.name,
                        isDeleted: false,
                    }
                };
            }
        }
        return msg;
      });
      setMessages(messagesWithReplies);
    }
  }, [dbMessages]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const saveMessage = async (message: Message, senderType: 'user' | 'ai') => {
    if (!currentUser) return;
    await supabase.from('ai_chat_history').insert({
      id: message.id,
      user_id: currentUser.id,
      sender: senderType,
      content: message.content,
      reply_to_message_id: message.reply_to?.id,
    });
  };

  const sendMessage = async (text: string, attachmentFile?: File, replyTo?: Message) => {
    if (!currentUser) return;

    setIsLoading(true);

    let attachmentForUi: Attachment | undefined;
    if (attachmentFile) {
      attachmentForUi = {
        name: attachmentFile.name,
        url: URL.createObjectURL(attachmentFile),
        type: attachmentFile.type,
        size: attachmentFile.size,
      };
    }

    const userMessage: Message = {
      id: uuidv4(), // Optimistic ID
      content: text,
      timestamp: new Date().toISOString(),
      sender: currentUser,
      attachment: attachmentForUi,
      reply_to: replyTo,
    } as Message;
    
    if (replyTo) {
      const repliedMsg = messages.find(m => m.id === replyTo.id);
      if (repliedMsg) {
          userMessage.repliedMessage = {
              content: repliedMsg.content || '',
              senderName: repliedMsg.sender.name,
              isDeleted: false,
          };
      }
    }

    addMessage(userMessage);
    await saveMessage(userMessage, 'user');

    try {
      const response = await analyzeProjects(messages, text);
      const result = response.result;
      const description = response.description;

      if (result === "Sorry, I'm having trouble.") {
        throw new Error(description);
      }

      const aiMessage: Message = {
        id: uuidv4(),
        content: result,
        timestamp: new Date().toISOString(),
        sender: AI_ASSISTANT_USER,
      } as Message;
      addMessage(aiMessage);
      await saveMessage(aiMessage, 'ai');

    } catch (error: any) {
      console.error("Error with AI response:", error);
      const description = error.message || "I couldn't process that request.";
      const errorMessage: Message = {
        id: uuidv4(),
        content: `Sorry, I'm having trouble: ${description}`,
        timestamp: new Date().toISOString(),
        sender: AI_ASSISTANT_USER,
      } as Message;
      addMessage(errorMessage);
      await saveMessage(errorMessage, 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    conversation: messages,
    isLoading: isLoading || isLoadingHistory,
    sendMessage,
    aiUser: AI_ASSISTANT_USER,
    isConnected: true, // Placeholder
    isCheckingConnection: false, // Placeholder
  };
};

export default useAiChat;