import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Message, Attachment, User } from '@/types';
import { analyzeProjects } from '@/lib/openai';

const AI_ASSISTANT_USER: User = {
  id: 'ai-assistant',
  name: 'AI Assistant',
  initials: 'AI',
  avatar: '/ai-avatar.png',
};

const initialMessage: Message = {
  id: 'ai-initial-message',
  text: "You can ask me to create projects, add tasks, write articles, or find information. How can I help you today?",
  timestamp: new Date().toISOString(),
  sender: AI_ASSISTANT_USER,
};

export const useAiChat = (currentUser: User | null) => {
  const [conversation, setConversation] = useState<Message[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const sendMessage = useCallback(async (text: string, attachment: Attachment | null) => {
    if (!currentUser) {
      toast.error("You must be logged in to chat with the AI.");
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      text,
      timestamp: new Date().toISOString(),
      sender: currentUser,
      attachment: attachment || undefined,
    };

    setConversation(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let aiPrompt = text;
      if (attachment) {
        aiPrompt += `\n\n(The user has attached a file named "${attachment.name}", but I cannot view its content. I should inform the user about this limitation if relevant to my response.)`;
      }

      const result = await analyzeProjects(aiPrompt, conversation.map(m => ({ sender: m.sender.id === currentUser.id ? 'user' : 'ai', content: m.text })));
      
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
      setConversation(prev => [...prev, aiMessage]);
    } catch (error: any) {
      let displayError = `Sorry, I encountered an error: ${error.message}.`;
      if (error.message.includes('non-2xx status code')) {
        displayError = "I'm having trouble connecting to my brain (the AI service). An administrator may need to configure the OpenAI integration in the settings.";
      }
      const errorMessage: Message = {
        id: uuidv4(),
        text: displayError,
        timestamp: new Date().toISOString(),
        sender: AI_ASSISTANT_USER,
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, conversation, queryClient]);

  return {
    conversation,
    isLoading,
    sendMessage,
    aiUser: AI_ASSISTANT_USER,
  };
};