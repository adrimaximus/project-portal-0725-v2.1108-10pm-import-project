import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lightbulb, Loader2, Send } from 'lucide-react';
import { Mood } from '@/data/mood';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

type Period = 'week' | 'month' | 'year';
type ConversationMessage = {
  sender: 'ai' | 'user';
  content: string;
};

interface AiFriendSuggestionProps {
  data: (Mood & { value: number })[];
  period: Period;
  userName: string;
}

const AiFriendSuggestion: React.FC<AiFriendSuggestionProps> = ({ data, period, userName }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, isLoading]);

  const fetchInitialInsight = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setConversation([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }
      const { data: statusData, error: statusError } = await supabase.functions.invoke('manage-openai-key', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        method: 'GET'
      });
      if (statusError || !statusData.connected) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }
      setIsConnected(true);

      const periodInIndonesian = { week: 'minggu', month: 'bulan', year: 'tahun' }[period];
      const moodSummary = data.length > 0 ? data.map(mood => `${mood.label} (${mood.value} kali)`).join(', ') : 'belum ada data suasana hati yang tercatat';
      const prompt = `Nama saya ${userName}. Selama ${periodInIndonesian} terakhir, ringkasan suasana hati saya adalah: ${moodSummary}. Berdasarkan data ini, berikan saya saran yang membangun.`;

      const { data: insightData, error: insightError } = await supabase.functions.invoke('generate-mood-insight', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { prompt, userName, conversationHistory: [] }
      });

      if (insightError) throw insightError;
      setConversation([{ sender: 'ai', content: insightData.result }]);
    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan saat menghubungi AI.");
      if (err.message.includes("not configured")) setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [data, period, userName]);

  useEffect(() => {
    fetchInitialInsight();
  }, [fetchInitialInsight]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newConversation: ConversationMessage[] = [...conversation, { sender: 'user', content: userInput }];
    setConversation(newConversation);
    setUserInput('');
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }
      const { data: insightData, error: insightError } = await supabase.functions.invoke('generate-mood-insight', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          prompt: userInput,
          userName,
          conversationHistory: newConversation,
        }
      });
      if (insightError) throw insightError;
      setConversation(prev => [...prev, { sender: 'ai', content: insightData.result }]);
    } catch (err: any) {
      console.error(err);
      setConversation(prev => [...prev, { sender: 'ai', content: "Maaf, saya mengalami sedikit masalah. Coba lagi nanti." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const dominantMood = data.length > 0 ? data.reduce((prev, current) => (prev.value > current.value) ? prev : current) : null;

  if (!isConnected && !isLoading) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-secondary text-center">
        <p className="text-sm text-muted-foreground mb-2">Hubungkan akun OpenAI di pengaturan admin untuk mendapatkan wawasan yang dipersonalisasi.</p>
        <Button asChild size="sm" variant="link">
          <Link to="/settings/integrations/openai">Pengaturan Integrasi</Link>
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={cn("mt-4 p-4 rounded-lg transition-colors duration-300", !dominantMood && "bg-secondary")}
      style={dominantMood ? { backgroundColor: `${dominantMood.color}20` } : {}}
    >
      <div className="flex items-start gap-3 mb-4">
        <div 
          className={cn("p-2 rounded-full transition-colors duration-300", !dominantMood && "bg-primary/10")}
          style={dominantMood ? { backgroundColor: `${dominantMood.color}30` } : {}}
        >
            <Lightbulb 
              className={cn("h-5 w-5 transition-colors duration-300", !dominantMood && "text-primary")}
              style={dominantMood ? { color: dominantMood.color, filter: 'brightness(75%)' } : {}}
            />
        </div>
        <h4 
          className="font-semibold text-sm pt-2"
          style={dominantMood ? { color: dominantMood.color, filter: 'brightness(75%)' } : {}}
        >
          Teman AI
        </h4>
      </div>

      <div ref={scrollRef} className="max-h-48 overflow-y-auto pr-2 space-y-3">
        {conversation.map((msg, index) => (
          <div key={index} className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'ai' && (
              <Avatar className="h-6 w-6 border">
                <AvatarFallback className="bg-transparent text-sm" style={dominantMood ? { color: dominantMood.color, filter: 'brightness(75%)' } : {}}>
                  <Lightbulb className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            <div className={cn(
              "rounded-lg px-3 py-2 text-sm",
              msg.sender === 'user' 
                ? 'bg-primary text-primary-foreground max-w-md' 
                : 'bg-[#eff3f4] dark:bg-stone-800 flex-1'
            )}>
              {msg.content}
            </div>
            {msg.sender === 'user' && user && (
              <Avatar className="h-6 w-6 border">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-2">
            <Avatar className="h-6 w-6 border">
              <AvatarFallback className="bg-transparent text-sm" style={dominantMood ? { color: dominantMood.color, filter: 'brightness(75%)' } : {}}>
                <Lightbulb className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="max-w-md rounded-lg px-3 py-2 text-sm bg-[#eff3f4] dark:bg-stone-800 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Mengetik...</span>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="relative mt-4">
        <Input
          placeholder="Balas di sini..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={isLoading}
        />
        <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handleSendMessage} disabled={isLoading || !userInput.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default AiFriendSuggestion;