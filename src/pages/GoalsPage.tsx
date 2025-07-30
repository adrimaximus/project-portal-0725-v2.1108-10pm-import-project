import { useState } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { dummyGoals, Goal } from '@/data/goals';
import GoalCard from '@/components/goals/GoalCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);

  return (
    <PortalLayout>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Goals</h1>
          <p className="text-muted-foreground">Track your habits and stay consistent.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Goal
        </Button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {goals.map(goal => (
          <Link to={`/goals/${goal.id}`} key={goal.id} className="no-underline h-full">
            <GoalCard 
              goal={goal} 
            />
          </Link>
        ))}
      </div>
    </PortalLayout>
  );
};

export default GoalsPage;