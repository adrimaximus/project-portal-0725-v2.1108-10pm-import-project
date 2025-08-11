import { useState, useEffect, useCallback } from 'react';
import { Goal } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { getAiInsightForGoal } from '@/lib/openai';

interface AiCoachInsightProps {
  goal: Goal;
}

export default function AiCoachInsight({ goal }: AiCoachInsightProps) {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    const newInsight = await getAiInsightForGoal(goal);
    setInsight(newInsight);
    setLoading(false);
  }, [goal]);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-yellow-500" />
          AI Coach Insight
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Generating insight...</p>
        ) : (
          <p className="text-muted-foreground">{insight}</p>
        )}
        <Button variant="link" onClick={fetchInsight} disabled={loading} className="p-0 h-auto mt-2">
          Get new insight
        </Button>
      </CardContent>
    </Card>
  );
}