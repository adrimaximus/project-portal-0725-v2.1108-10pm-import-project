import { Goal, GoalCompletion } from '@/data/goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import GoalLogTable from './GoalLogTable';

interface GoalCompletionsProps {
  goal: Goal;
  onUpdate: (goal: Goal) => void;
}

const GoalCompletions = ({ goal, onUpdate }: GoalCompletionsProps) => {
  const [value, setValue] = useState('');

  const handleAddCompletion = () => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      toast.error("Please enter a valid positive number for the contribution.");
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

    onUpdate(updatedGoal);
    setValue('');
    toast.success("Progress logged successfully!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={`Add contribution... (${goal.unit || 'units'})`}
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

export default GoalCompletions;