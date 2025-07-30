import { useState } from 'react';
import { goals as initialGoals, Goal } from '@/data/goals';
import GoalCard from '@/components/goals/GoalCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Goals</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  );
};

export default GoalsPage;