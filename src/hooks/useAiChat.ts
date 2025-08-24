import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Message, Attachment, User } from '@/types';
import { analyzeProjects } from '@/lib/openai';
import { supabase } from '@/integrations/supabase/client';

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

const mapDbMessageToUiMessage = (dbMsg: any, currentUser: User): Message => ({
  id: dbMsg.id,
  text: dbMsg.content,
  timestamp: dbMsg.created_at,
  sender: dbMsg.sender === 'user' ? currentUser : AI_ASSISTANT_USER,
});

export const useAiChat = (currentUser: User | null) => {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const queryClient = useQueryClient();

  const { data: initialHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['aiChatHistory', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true });
      if (error) {
        toast.error("Failed to load chat history.");
        throw error;
      }
      return data.map(dbMsg => mapDbMessageToUiMessage(dbMsg, currentUser));
    },
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (!isLoadingHistory) {
      if (initialHistory.length > 0) {
        setConversation(initialHistory);
      } else {
        setConversation([initialMessage]);
      }
    }
  }, [initialHistory, isLoadingHistory]);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel(`ai_chat_history:${currentUser.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'ai_chat_history', 
        filter: `user_id=eq.${currentUser.id}` 
      },
        (payload) => {
          const newMessage = mapDbMessageToUiMessage(payload.new, currentUser);
          // Prevent adding our own optimistic message again
          setConversation(prev => {
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  const checkConnection = useCallback(async () => {
    setIsCheckingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-openai-key', { method: 'GET' });
      if (error) throw error;
      setIsConnected(data.connected);
    } catch (error) {
      console.error("Failed to check OpenAI connection status:", error);
      setIsConnected(false);
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const sendMessage = useCallback(async (text: string, attachmentFile: File | null) => {
    if (!currentUser) {
      toast.error("You must be logged in to chat with the AI.");
      return;
    }

    let attachmentForUi: Attachment | undefined = undefined;
    if (attachmentFile) {
      attachmentForUi = {
        name: attachmentFile.name,
        url: URL.createObjectURL(attachmentFile),
        type: attachmentFile.type.startsWith('image/') ? 'image' : 'file',
      };
    }

    const userMessage: Message = {
      id: uuidv4(), // Optimistic ID
      text,
      timestamp: new Date().toISOString(),
      sender: currentUser,
      attachment: attachmentForUi,
    };

    setConversation(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let attachmentUrl: string | null = null;
      if (attachmentFile) {
        const sanitizedFileName = attachmentFile.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = `ai-uploads/${currentUser.id}/${uuidv4()}-${sanitizedFileName}`;
        const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, attachmentFile);
        if (uploadError) throw new Error(`Failed to upload attachment: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
        attachmentUrl = urlData.publicUrl;
      }

      // The Edge Function now handles history, so we don't pass it from here.
      const result = await analyzeProjects(text, undefined, attachmentUrl);
      
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
  
      // The AI response will be added via the real-time subscription.
      // We no longer need to add it here manually.

    } catch (error: any) {
      let displayError = `Sorry, I encountered an error: ${error.message}.`;
      if (error.message.includes('non-2xx status code') || error.message.includes('not configured')) {
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
  }, [currentUser, queryClient]);

  return {
    conversation,
    isLoading: isLoading || isLoadingHistory,
    sendMessage,
    aiUser: AI_ASSISTANT_USER,
    isConnected,
    isCheckingConnection,
  };
};