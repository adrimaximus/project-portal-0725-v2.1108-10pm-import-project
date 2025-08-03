import { useState, useEffect } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { dummyGoals, Goal } from '@/data/goals';
import NewGoalDialog from '@/components/goals/NewGoalDialog';
import GoalCard from '@/components/goals/GoalCard';
import { v4 as uuidv4 } from 'uuid';

const GoalsPage = () => {
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    // This ensures we are working with a fresh copy and not mutating the original
    setGoals([...dummyGoals]);
  }, []);

  const handleGoalCreate = (newGoalData: Omit<Goal, 'id' | 'completions' | 'collaborators'>) => {
    const newGoal: Goal = {
      ...newGoalData,
      id: uuidv4(),
      completions: [],
      collaborators: [],
    };
    
    // Update the dummyGoals array so the change persists across navigation
    dummyGoals.unshift(newGoal);
    // Update the local state to re-render the component
    setGoals(prevGoals => [newGoal, ...prevGoals]);
  };

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Goals</h1>
        <Button onClick={() => setIsNewGoalDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      <NewGoalDialog
        open={isNewGoalDialogOpen}
        onOpenChange={setIsNewGoalDialogOpen}
        onGoalCreate={handleGoalCreate}
      />
    </PortalLayout>
  );
};

export default GoalsPage;