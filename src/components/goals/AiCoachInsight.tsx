import { useState, useEffect, useCallback } from 'react';
import { Goal } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Loader2 } from 'lucide-react';
import { generateAiInsight } from '@/lib/openai';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AiCoachInsightProps {
  goal: Goal;
  yearlyProgress?: { percentage: number } | null;
  monthlyProgress?: { name: string; percentage: number; completedCount: number; possibleCount: number; } | null;
}

const AiCoachInsight = ({ goal, yearlyProgress, monthlyProgress }: AiCoachInsightProps) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      const { data, error } = await supabase.functions.invoke('manage-openai-key', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        method: 'GET'
      });
      if (error) throw error;
      setIsConnected(data.connected);
      return data.connected;
    } catch (error) {
      console.error("Failed to check OpenAI connection status:", error);
      setIsConnected(false);
      return false;
    }
  }, []);

  const fetchInsight = useCallback(async () => {
    setIsLoading(true);
    setInsight(null);
    try {
      const context: { 
        yearly?: { percentage: number }; 
        month?: { name: string; percentage: number; completedCount: number; possibleCount: number; };
        constraints?: string;
      } = {};

      if (monthlyProgress) {
        context.month = monthlyProgress;
      } else if (yearlyProgress) {
        context.yearly = yearlyProgress;
      } else {
        setIsLoading(false);
        return;
      }
      
      // Add formatting instructions to limit character count
      context.constraints = "Berikan ringkasan dalam total maksimal 545 karakter. Hitung dulu estimasi karakter agar kalimatnya lengkap dan tidak terpotong.";

      const newInsight = await generateAiInsight(goal, context);
      setInsight(newInsight);
    } catch (error: any) {
      console.error("Failed to generate AI insight:", error);
      if (!error.message.includes("configured")) {
        toast.error("Couldn't get an insight from the AI coach right now.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [goal, yearlyProgress, monthlyProgress]);

  useEffect(() => {
    checkConnection().then(connected => {
      if (connected && (yearlyProgress || monthlyProgress)) {
        fetchInsight();
      }
    });
  }, [checkConnection, fetchInsight, yearlyProgress, monthlyProgress]);

  if (!isConnected) {
    return (
      <Card className="mt-4 bg-muted/50 border-dashed">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">Connect OpenAI in the admin settings to get personalized insights.</p>
          <Button asChild size="sm" variant="link" className="px-0 h-auto text-yellow-600">
            <Link to="/settings/integrations/openai">Integration Settings</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 bg-muted/50 border-dashed">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          AI Coach
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        {!isLoading && insight && (
          <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-foreground/90" {...props} />,
              }}
            >
              {insight}
            </ReactMarkdown>
          </div>
        )}
        {!isLoading && !insight && (
           <p className="text-sm text-muted-foreground">Click "Get New Insight" to see what the AI coach thinks.</p>
        )}
        <Button
          variant="link"
          size="sm"
          className="mt-2 px-0 h-auto text-yellow-600"
          onClick={fetchInsight}
          disabled={isLoading}
        >
          {isLoading ? 'Getting new insight...' : 'Get New Insight'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AiCoachInsight;