import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { analyzeProjects } from '@/lib/openai';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Loader2 } from 'lucide-react';

type ConversationMessage = {
  sender: 'user' | 'ai';
  content: string;
};

const AiChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, isLoading]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const message = userInput;
    const newConversation: ConversationMessage[] = [...conversation, { sender: 'user', content: message }];
    setConversation(newConversation);
    setUserInput('');
    setIsLoading(true);

    try {
      const result = await analyzeProjects(message, conversation);
      
      const successKeywords = ['done!', 'updated', 'created', 'changed', 'i\'ve made'];
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
  
      setConversation(prev => [...prev, { sender: 'ai', content: result }]);
    } catch (error: any) {
      setConversation(prev => [...prev, { sender: 'ai', content: `Sorry, I encountered an error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {conversation.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Sparkles className="h-16 w-16 mb-4 text-primary/50" />
            <h2 className="text-2xl font-semibold">AI Assistant</h2>
            <p className="mt-2 max-w-md">
              You can ask me to create projects, add tasks, write articles, or find information. How can I help you today?
            </p>
          </div>
        )}
        {conversation.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'ai' && (
              <Avatar className="h-8 w-8 border">
                <AvatarFallback className="bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></AvatarFallback>
              </Avatar>
            )}
            <div className={`max-w-2xl rounded-lg px-4 py-3 ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
            {msg.sender === 'user' && user && (
              <Avatar className="h-8 w-8 border">
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-4">
            <Avatar className="h-8 w-8 border">
              <AvatarFallback className="bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div className="max-w-sm rounded-lg px-4 py-3 bg-muted flex items-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        )}
      </div>
      <div className="border-t p-4 flex-shrink-0 bg-background">
        <div className="relative max-w-3xl mx-auto">
          <Textarea
            placeholder="Ask me to do something, like 'Create a new project for the Q4 marketing campaign'..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="pr-12 min-h-[52px]"
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AiChat;