import { useState, useRef, forwardRef, useEffect } from 'react';
import { ChatInput } from './ChatInput';
import { Message as MessageType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase';
import { toast } from 'sonner';
import { MessageList } from './MessageList';
import { Mention } from 'primereact/mention';

interface AiChatViewProps {
  initialMessages?: MessageType[];
}

const AiChatView = forwardRef<Mention, AiChatViewProps>(({ initialMessages = [] }, ref) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chat history:', error);
        toast.error('Failed to load chat history.');
      } else {
        const formattedMessages: MessageType[] = data.map((item: any) => ({
          id: item.id,
          sender_id: item.sender === 'user' ? user.id : 'ai',
          content: item.content,
          created_at: item.created_at,
          conversation_id: 'ai-chat',
          sender_first_name: item.sender === 'user' ? user.first_name : 'AI',
          sender_last_name: item.sender === 'user' ? user.last_name : 'Assistant',
          sender_avatar_url: item.sender === 'user' ? user.avatar_url : '/ai-avatar.png',
          sender_email: item.sender === 'user' ? user.email : 'ai@assistant.com',
        }));
        setMessages(formattedMessages);
      }
    };

    fetchHistory();
  }, [user]);

  const handleSendMessage = async (text: string, attachment: File | null) => {
    if (!user) {
      toast.error("You must be logged in to chat.");
      return;
    }
    if (!text.trim()) return;

    const userMessage: MessageType = {
      id: Date.now().toString(),
      sender_id: user.id,
      content: text,
      created_at: new Date().toISOString(),
      conversation_id: 'ai-chat',
      sender_first_name: user.first_name,
      sender_last_name: user.last_name,
      sender_avatar_url: user.avatar_url,
      sender_email: user.email,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsSending(true);

    try {
      // Here you would call your AI backend
      // For demonstration, we'll just echo the message back from "AI"
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      const aiResponse: MessageType = {
        id: (Date.now() + 1).toString(),
        sender_id: 'ai',
        content: `This is a simulated AI response to: "${text}"`,
        created_at: new Date().toISOString(),
        conversation_id: 'ai-chat',
        sender_first_name: 'AI',
        sender_last_name: 'Assistant',
        sender_avatar_url: '/ai-avatar.png',
        sender_email: 'ai@assistant.com',
      };
      setMessages(prev => [...prev, aiResponse]);

      // Save to DB
      await supabase.from('ai_chat_history').insert([
        { user_id: user.id, sender: 'user', content: text },
        { user_id: user.id, sender: 'ai', content: aiResponse.content }
      ]);

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to get response from AI.");
      // Optionally remove the user's message if the API call fails
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <ChatInput 
        ref={ref} 
        onSendMessage={handleSendMessage}
        isSending={isSending}
        conversationId="ai-chat"
        replyTo={null}
        onCancelReply={() => {}}
      />
    </div>
  );
});

export default AiChatView;