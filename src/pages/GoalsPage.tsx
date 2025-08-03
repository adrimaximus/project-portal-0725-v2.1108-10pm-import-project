import { useState, useEffect } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Goal, dummyGoals } from '@/data/goals';
import GoalFormDialog from '@/components/goals/GoalFormDialog';
import GoalCard from '@/components/goals/GoalCard';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/data/users';

const GoalsPage = () => {
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    setGoals([...dummyGoals]);
  }, []);

  const handleGoalCreate = (newGoalData: Omit<Goal, 'id' | 'completions' | 'collaborators'>) => {
    const newGoal: Goal = {
      ...newGoalData,
      id: uuidv4(),
      completions: [],
      collaborators: [],
    };
    
    dummyGoals.unshift(newGoal);
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

      <GoalFormDialog
        open={isNewGoalDialogOpen}
        onOpenChange={setIsNewGoalDialogOpen}
        onGoalCreate={handleGoalCreate}
      />
    </PortalLayout>
  );
};

export default GoalsPage;