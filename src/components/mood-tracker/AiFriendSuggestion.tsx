import React, { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Mood } from '@/data/mood';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Period = 'week' | 'month' | 'year';

interface AiFriendSuggestionProps {
  data: (Mood & { value: number })[];
  period: Period;
  userName: string;
}

const AiFriendSuggestion: React.FC<AiFriendSuggestionProps> = ({ data, period, userName }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [insight, setInsight] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAiInsight = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setInsight('');

    try {
      const { data: statusData, error: statusError } = await supabase.functions.invoke('manage-openai-key', { method: 'GET' });
      if (statusError || !statusData.connected) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }
      setIsConnected(true);

      const periodInIndonesian = {
        week: 'minggu',
        month: 'bulan',
        year: 'tahun'
      }[period];

      const moodSummary = data.length > 0 
        ? data.map(mood => `${mood.label} (${mood.value} kali)`).join(', ')
        : 'belum ada data suasana hati yang tercatat';

      const prompt = `
        Nama saya ${userName}. Selama ${periodInIndonesian} terakhir, ringkasan suasana hati saya adalah: ${moodSummary}.
        Berdasarkan data ini, berikan saya saran yang membangun.
      `;

      const { data: insightData, error: insightError } = await supabase.functions.invoke('openai-generator', {
        body: {
          feature: 'generate-mood-insight',
          payload: { prompt, userName }
        }
      });

      if (insightError) {
        throw insightError;
      }

      setInsight(insightData.result);

    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan saat menghubungi AI.");
      if (err.message.includes("not configured")) {
        setIsConnected(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [data, period, userName]);

  useEffect(() => {
    fetchAiInsight();
  }, [fetchAiInsight]);

  if (isLoading) {
    return (
      <div className="mt-4 p-4 bg-secondary rounded-lg">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="mt-4 p-4 bg-secondary rounded-lg text-center">
        <p className="text-sm text-muted-foreground mb-2">Hubungkan akun OpenAI di pengaturan admin untuk mendapatkan wawasan yang dipersonalisasi.</p>
        <Button asChild size="sm" variant="link">
          <Link to="/settings/integrations/openai">Pengaturan Integrasi</Link>
        </Button>
      </div>
    );
  }

  const dominantMood = data.length > 0 ? data.reduce((prev, current) => (prev.value > current.value) ? prev : current) : null;

  return (
    <div 
      className={cn("mt-4 p-4 rounded-lg transition-colors duration-300", !dominantMood && "bg-secondary")}
      style={dominantMood ? { backgroundColor: `${dominantMood.color}20` } : {}}
    >
      <div className="flex items-start gap-3">
        <div 
          className={cn("p-2 rounded-full transition-colors duration-300", !dominantMood && "bg-primary/10")}
          style={dominantMood ? { backgroundColor: `${dominantMood.color}30` } : {}}
        >
            <Lightbulb 
              className={cn("h-5 w-5 transition-colors duration-300", !dominantMood && "text-primary")}
              style={dominantMood ? { color: dominantMood.color, filter: 'brightness(75%)' } : {}}
            />
        </div>
        <div>
            <h4 
              className="font-semibold text-sm transition-colors duration-300"
              style={dominantMood ? { color: dominantMood.color, filter: 'brightness(75%)' } : {}}
            >
              Pikiran dari Teman AI-mu
            </h4>
            {error ? <p className="text-sm text-destructive mt-1">{error}</p> : <p className="text-sm text-muted-foreground mt-1">{insight}</p>}
        </div>
      </div>
    </div>
  );
};

export default AiFriendSuggestion;