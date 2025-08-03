import { useState } from 'react';
import { Goal, GoalCompletion } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import GoalLogTable from './GoalLogTable';
import { useGoals } from '@/context/GoalsContext';

interface GoalValueTrackerProps {
  goal: Goal;
}

const GoalValueTracker = ({ goal }: GoalValueTrackerProps) => {
  const { updateGoal } = useGoals();
  const [value, setValue] = useState('');

  const handleAddCompletion = () => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      toast.error("Please enter a valid positive number.");
      return;
    }

    const newCompletion: GoalCompletion = {
      id: `comp-${Date.now()}`,
      date: new Date().toISOString(),
      value: numericValue,
      userId: 'user-1', // Assuming the current user is 'user-1'
    };

    const updatedGoal = {
      ...goal,
      completions: [...goal.completions, newCompletion],
    };

    updateGoal(updatedGoal);
    setValue('');
    toast.success("Progress logged successfully!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Progress</CardTitle>
        <CardDescription>Log a new value contribution for this goal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={`e.g., 1500 (${goal.unit || '$'})`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button onClick={handleAddCompletion}>Add</Button>
        </div>
        <GoalLogTable goal={goal} />
      </CardContent>
    </Card>
  );
};

export default GoalValueTracker;