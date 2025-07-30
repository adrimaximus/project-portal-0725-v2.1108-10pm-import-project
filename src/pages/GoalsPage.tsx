import { useState } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { dummyGoals, Goal } from '@/data/goals';
import GoalCard from '@/components/goals/GoalCard';
import GoalDetail from '@/components/goals/GoalDetail';
import { Button } from '@/components/ui/button';
import { Plus, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);

  const defaultNewGoal: Goal = {
    id: '',
    title: '',
    icon: Target,
    color: '#3B82F6',
    frequency: 'Everyday',
    completions: [],
  };

  const handleCreateGoal = (newGoal: Goal) => {
    const goalToAdd = { ...newGoal, id: (goals.length + 1).toString() };
    setGoals([goalToAdd, ...goals]);
    setIsNewGoalModalOpen(false);
  };

  return (
    <PortalLayout>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Goals</h1>
          <p className="text-muted-foreground">Track your habits and stay consistent.</p>
        </div>
        <Dialog open={isNewGoalModalOpen} onOpenChange={setIsNewGoalModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a New Goal</DialogTitle>
              <DialogDescription>
                Set up a new goal to track your progress. What do you want to achieve?
              </DialogDescription>
            </DialogHeader>
            <GoalDetail 
              goal={defaultNewGoal}
              onUpdate={handleCreateGoal}
              onClose={() => setIsNewGoalModalOpen(false)}
              isCreateMode
            />
          </DialogContent>
        </Dialog>
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