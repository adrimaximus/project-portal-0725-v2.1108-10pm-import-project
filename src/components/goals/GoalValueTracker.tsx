import { useState, useMemo } from 'react';
import { Goal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCompletionsForPeriod } from '@/lib/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GoalValueTrackerProps {
  goal: Goal;
  onCompletionLogged: (completion: any) => void;
}

export default function GoalValueTracker({ goal, onCompletionLogged }: GoalValueTrackerProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number | ''>('');

  const handleLog = async () => {
    if (!user || !amount) return;
    const { data, error } = await supabase.from('goal_completions').insert({
      goal_id: goal.id,
      user_id: user.id,
      date: new Date().toISOString(),
      value: amount,
    }).select().single();

    if (error) {
      toast.error(`Failed to log value: ${error.message}`);
    } else {
      toast.success("Value logged!");
      onCompletionLogged(data);
      setAmount('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Progress</CardTitle>
        <CardDescription>
          Add a new value entry for your goal.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-2">
        <Input
          type="number"
          placeholder={`Amount (${goal.unit})`}
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
        />
        <Button onClick={handleLog} disabled={!amount}>
          Log
        </Button>
      </CardContent>
    </Card>
  );
}