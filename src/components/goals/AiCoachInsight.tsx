import { useState, useEffect, useCallback } from 'react';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Loader2 } from 'lucide-react';
import { getAiCoachInsight } from '@/lib/openai';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface AiCoachInsightProps {
  goal: Goal;
  progress: { percentage: number } | null;
}

const AiCoachInsight = ({ goal, progress }: AiCoachInsightProps) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsight = useCallback(async () => {
    setIsLoading(true);
    setInsight(null);
    try {
      const newInsight = await getAiCoachInsight(goal, progress);
      setInsight(newInsight);
    } catch (error) {
      console.error("Failed to generate AI insight:", error);
      toast.error("Couldn't get an insight from the AI coach right now.");
    } finally {
      setIsLoading(false);
    }
  }, [goal, progress]);

  useEffect(() => {
    // Automatically fetch insight when component mounts with valid progress
    if (progress !== null) {
      fetchInsight();
    }
  }, [fetchInsight, progress]);

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