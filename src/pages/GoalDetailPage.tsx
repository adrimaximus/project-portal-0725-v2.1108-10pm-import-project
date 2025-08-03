import { useParams, useNavigate } from 'react-router-dom';
import { useGoals } from '@/context/GoalsContext';
import { Completion } from '@/data/goals';
import GoalValueTracker from '@/components/goals/GoalValueTracker';
import GoalQuantityTracker from '@/components/goals/GoalQuantityTracker';
import GoalFrequencyTracker from '@/components/goals/GoalFrequencyTracker';
import GoalProgressChart from '@/components/goals/GoalProgressChart';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const GoalDetailPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { goals, updateGoal } = useGoals();

  const goal = goals.find(g => g.id === goalId);

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl text-muted-foreground">Goal not found.</p>
        <Button variant="ghost" onClick={() => navigate('/goals')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Goals
        </Button>
      </div>
    );
  }

  const handleLogValue = (date: Date, value: number) => {
    const newCompletion: Completion = {
      date: date.toISOString(),
      value,
      achiever: 'You', // Assuming the current user is 'You'
    };
    const updatedGoal = {
      ...goal,
      completions: [...goal.completions, newCompletion],
    };
    updateGoal(updatedGoal);
  };

  const handleLogFrequency = (date: Date) => {
    const newCompletion: Completion = {
      date: date.toISOString(),
      value: 1, // For frequency, value is always 1
      achiever: 'You',
    };
    const updatedGoal = {
      ...goal,
      completions: [...goal.completions, newCompletion],
    };
    updateGoal(updatedGoal);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate('/goals')} className="-ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Goals
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{goal.title}</h1>
        <p className="text-muted-foreground max-w-2xl">{goal.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {goal.type === 'value' && (
            <GoalValueTracker goal={goal} onLogValue={handleLogValue} />
          )}
          {goal.type === 'quantity' && (
            <GoalQuantityTracker goal={goal} onLogValue={handleLogValue} />
          )}
          {goal.type === 'frequency' && (
            <GoalFrequencyTracker goal={goal} onLogFrequency={handleLogFrequency} />
          )}
        </div>
        <div className="lg:col-span-2 space-y-6">
          {(goal.type === 'quantity' || goal.type === 'value') && (
            <GoalProgressChart goal={goal} />
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalDetailPage;