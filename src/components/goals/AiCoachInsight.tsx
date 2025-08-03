import { useState, useEffect, useCallback } from 'react';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Loader2 } from 'lucide-react';
import { generateAiInsight } from '@/lib/openai';
import { toast } from 'sonner';

interface AiCoachInsightProps {
  goal: Goal;
}

const AiCoachInsight = ({ goal }: AiCoachInsightProps) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsight = useCallback(async () => {
    setIsLoading(true);
    setInsight(null);
    try {
      // Pass the entire goal object, not just a string property
      const newInsight = await generateAiInsight(goal);
      setInsight(newInsight);
    } catch (error) {
      console.error("Failed to generate AI insight:", error);
      toast.error("Couldn't get an insight from the AI coach right now.");
    } finally {
      setIsLoading(false);
    }
  }, [goal]);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">AI Coach</CardTitle>
        <Lightbulb className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        {!isLoading && insight && (
          <p className="text-sm text-muted-foreground">{insight}</p>
        )}
        {!isLoading && !insight && (
           <p className="text-sm text-muted-foreground">Click "Get Insight" to see what the AI coach thinks.</p>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
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