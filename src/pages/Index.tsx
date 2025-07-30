import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dummyGoals, Goal } from '@/data/goals';
import GoalCard from '@/components/goals/GoalCard';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import GoalDetail from '@/components/goals/GoalDetail';
import { Book } from 'lucide-react';

const Index = () => {
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setGoals(currentGoals =>
      currentGoals.map(g => (g.id === updatedGoal.id ? updatedGoal : g))
    );
    // In a real app, you would also close the modal here.
  };

  const handleCreateGoal = (newGoal: Goal) => {
    setGoals(currentGoals => [
      ...currentGoals,
      { ...newGoal, id: String(Date.now()) }, // Assign a simple unique ID
    ]);
    setCreateModalOpen(false);
  };

  const newGoalTemplate: Goal = {
    id: '',
    title: '',
    icon: Book,
    color: '#4A90E2',
    frequency: 'Every 1 day for 1 week',
    completions: [],
    specificDays: [],
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Goals</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Goal</DialogTitle>
            </DialogHeader>
            <GoalDetail 
              goal={newGoalTemplate} 
              onUpdate={handleCreateGoal}
              onClose={() => setCreateModalOpen(false)}
              isCreateMode
            />
          </DialogContent>
        </Dialog>
      </header>

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => (
            <Link to={`/goal/${goal.id}`} key={goal.id} className="no-underline text-current block">
              <GoalCard goal={goal} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold text-muted-foreground">No goals yet!</h2>
          <p className="text-muted-foreground mt-2">Click "New Goal" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default Index;