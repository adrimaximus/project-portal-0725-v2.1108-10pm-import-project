import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Message, ChatMessageAttachment, User, ConversationMessage } from '@/types';
import { analyzeProjects } from '@/lib/openai';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const AI_ASSISTANT_USER: User = {
  id: 'ai-assistant',
  name: 'AI Assistant',
  initials: 'AI',
  avatar_url: '/ai-avatar.png',
  email: 'ai@assistant.com',
  first_name: 'AI',
  last_name: 'Assistant',
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
  reply_to_message_id: dbMsg.reply_to_message_id,
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
      
      const messages = data.map(dbMsg => mapDbMessageToUiMessage(dbMsg, currentUser));
      
      const messagesWithReplies = messages.map(msg => {
          if (msg.reply_to_message_id) {
              const repliedMsg = messages.find(m => m.id === msg.reply_to_message_id);
              if (repliedMsg) {
                  return {
                      ...msg,
                      repliedMessage: {
                          content: repliedMsg.text,
                          senderName: repliedMsg.sender.name,
                          isDeleted: false,
                      }
                  };
              }
          }
          return msg;
      });

      return messagesWithReplies;
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
        () => {
          queryClient.invalidateQueries({ queryKey: ['aiChatHistory', currentUser.id] });
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, queryClient]);

  const checkConnection = useCallback(async () => {
    setIsCheckingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-openai-key', {
        method: 'GET'
      });
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

  // Updated to handle array of files
  const sendMessage = useCallback(async (text: string, attachmentFiles: File[], replyToMessageId?: string | null) => {
    if (!currentUser) {
      toast.error("You must be logged in to chat with the AI.");
      return;
    }

    // Prepare attachment for UI (just taking the first one for now as per current UI limitation or AI limitation)
    let attachmentForUi: ChatMessageAttachment | undefined = undefined;
    if (attachmentFiles.length > 0) {
      const file = attachmentFiles[0];
      attachmentForUi = {
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
      };
    }

    const userMessage: Message = {
      id: uuidv4(), // Optimistic ID
      text,
      timestamp: new Date().toISOString(),
      sender: currentUser,
      attachment: attachmentForUi,
      reply_to_message_id: replyToMessageId,
    };

    if (replyToMessageId) {
        const repliedMsg = conversation.find(m => m.id === replyToMessageId);
        if (repliedMsg) {
            userMessage.repliedMessage = {
                content: repliedMsg.text,
                senderName: repliedMsg.sender.name,
                isDeleted: false,
            };
        }
    }

    setConversation(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let attachmentUrl: string | null = null;
      let attachmentType: string | null = null;
      
      // Upload first attachment only for AI analysis for now
      if (attachmentFiles.length > 0) {
        const file = attachmentFiles[0];
        attachmentType = file.type;
        const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = `ai-uploads/${currentUser.id}/${uuidv4()}-${sanitizedFileName}`;
        const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, file);
        if (uploadError) throw new Error(`Failed to upload attachment: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);
        attachmentUrl = urlData.publicUrl;
      }

      // Save user message to DB first
      const { error: dbError } = await supabase.from('ai_chat_history').insert({
        id: userMessage.id,
        user_id: currentUser.id,
        sender: 'user',
        content: text,
        reply_to_message_id: replyToMessageId,
      });
      if (dbError) {
        console.error("Failed to save user message:", dbError);
      }

      const result = await analyzeProjects(text, undefined, undefined, attachmentUrl, attachmentType);
      
      const aiMessage: Message = {
        id: uuidv4(),
        text: result,
        timestamp: new Date().toISOString(),
        sender: AI_ASSISTANT_USER,
      };
      setConversation(prev => [...prev, aiMessage]);

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
  
    } catch (error: any) {
      let description = "An unknown error occurred. Please check the console.";
      
      if (error.context && typeof error.context.json === 'function') {
        try {
          const errorBody = await error.context.json();
          if (errorBody.error) {
            description = errorBody.error;
          } else {
            description = "The server returned an error without a specific message.";
          }
        } catch (e) {
          description = "Failed to parse the error response from the server.";
        }
      } else {
        description = error.message || "The server returned an error.";
      }
      
      const errorMessage: Message = {
        id: uuidv4(),
        text: `Sorry, I'm having trouble: ${description}`,
        timestamp: new Date().toISOString(),
        sender: AI_ASSISTANT_USER,
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, queryClient, conversation]);

  return {
    conversation,
    isLoading: isLoading || isLoadingHistory,
    sendMessage,
    aiUser: AI_ASSISTANT_USER,
    isConnected,
    isCheckingConnection,
  };
};