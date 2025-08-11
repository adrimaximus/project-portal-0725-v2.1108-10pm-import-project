import { useState, useMemo } from 'react';
import { Goal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Plus, Minus } from 'lucide-react';
import { getCompletionsForPeriod } from '@/lib/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GoalQuantityTrackerProps {
  goal: Goal;
  onCompletionLogged: (completion: any) => void;
}

export default function GoalQuantityTracker({ goal, onCompletionLogged }: GoalQuantityTrackerProps) {
  const { user } = useAuth();
  const todaysCompletions = useMemo(() => getCompletionsForPeriod(goal, 'today'), [goal]);
  const [todaysCount, setTodaysCount] = useState(todaysCompletions.length);

  const handleLog = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('goal_completions').insert({
      goal_id: goal.id,
      user_id: user.id,
      date: new Date().toISOString(),
      value: 1,
    }).select().single();

    if (error) {
      toast.error(`Failed to log completion: ${error.message}`);
    } else {
      toast.success("Completion logged!");
      setTodaysCount(prev => prev + 1);
      onCompletionLogged(data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Progress</CardTitle>
        <CardDescription>
          You've completed this {todaysCount} time(s) today.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <Button size="lg" onClick={handleLog}>
          <Check className="mr-2 h-5 w-5" /> Log Completion
        </Button>
      </CardContent>
    </Card>
  );
}