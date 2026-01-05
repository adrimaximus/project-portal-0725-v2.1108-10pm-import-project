import { useState, useEffect, useCallback, useRef } from 'react';
import { Goal } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Loader2, Sparkles, AlertCircle } from 'lucide-react';
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
  const prevProgressRef = useRef<string>("");

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
    // Keep showing old insight while loading new one if available, to avoid flicker
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
      
      // Enhanced prompt instructions for better Indonesian output
      context.constraints = "Berikan analisis singkat, padat, dan memotivasi dalam Bahasa Indonesia yang santai namun profesional. Fokus pada pencapaian dan saran perbaikan. Pastikan kalimat lengkap dan tidak terpotong. Maksimal 3 kalimat utama.";

      const newInsight = await generateAiInsight(goal, context);
      setInsight(newInsight);
    } catch (error: any) {
      console.error("Failed to generate AI insight:", error);
      if (!error.message.includes("configured")) {
        // Silent fail for auto-updates to not annoy user, just log
        console.warn("Couldn't get an insight from the AI coach right now.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [goal, yearlyProgress, monthlyProgress]);

  useEffect(() => {
    let isMounted = true;

    const runAutoFetch = async () => {
        const connected = await checkConnection();
        if (connected && isMounted) {
            // Create a signature of the current progress state to detect changes
            const currentProgressSig = JSON.stringify({ 
                yearly: yearlyProgress?.percentage, 
                monthly: monthlyProgress ? { ...monthlyProgress } : null 
            });

            // Only fetch if progress data has actually changed or if we have no insight yet
            if (currentProgressSig !== prevProgressRef.current || !insight) {
                prevProgressRef.current = currentProgressSig;
                await fetchInsight();
            }
        }
    };

    runAutoFetch();

    return () => {
        isMounted = false;
    };
  }, [checkConnection, fetchInsight, yearlyProgress, monthlyProgress, insight]); 

  if (!isConnected) {
    return (
      <Card className="mt-4 bg-amber-50/50 border-amber-200/50 border-dashed dark:bg-amber-950/10 dark:border-amber-900/30">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-500">
            <Lightbulb className="h-4 w-4" />
            AI Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Connect OpenAI to get personalized insights and motivation for your goals.
              </p>
              <Button asChild size="sm" variant="outline" className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-800 dark:text-amber-500 dark:hover:bg-amber-900/30">
                <Link to="/settings/integrations/openai">Connect Integration</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't render empty card if loading initially and no insight
  if (isLoading && !insight) {
      return (
        <Card className="mt-4 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 border-indigo-100/50 dark:from-indigo-950/10 dark:via-background dark:to-purple-950/10 dark:border-indigo-900/30 shadow-sm animate-pulse">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                AI Coach Insight
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-4 bg-indigo-100/50 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-indigo-100/50 rounded w-1/2"></div>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card className="mt-4 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 border-indigo-100/50 dark:from-indigo-950/10 dark:via-background dark:to-purple-950/10 dark:border-indigo-900/30 shadow-sm transition-all duration-500">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          AI Coach Insight
        </CardTitle>
        {/* Removed Manual Refresh Button to keep UI clean as requested, auto-update handles it */}
        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />}
      </CardHeader>
      <CardContent>
        {insight ? (
          <div className="text-sm text-foreground/80 leading-relaxed bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30">
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-indigo-700 dark:text-indigo-400" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="pl-1 marker:text-indigo-400" {...props} />,
              }}
            >
              {insight}
            </ReactMarkdown>
          </div>
        ) : (
           <div className="text-center py-4 px-2">
             <p className="text-xs text-muted-foreground">
               Analyzing your progress...
             </p>
           </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AiCoachInsight;