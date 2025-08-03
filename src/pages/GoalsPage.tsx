import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import GoalCard from '@/components/goals/GoalCard';
import { dummyGoals, Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import GoalFormDialog from '@/components/goals/GoalFormDialog';
import { toast } from 'sonner';

const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>(dummyGoals);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleGoalUpdate = (updatedGoal: Goal) => {
    const goalIndex = goals.findIndex(g => g.id === updatedGoal.id);
    let newGoals;
    if (goalIndex > -1) {
      newGoals = [...goals];
      newGoals[goalIndex] = updatedGoal;
      toast.success(`Goal "${updatedGoal.title}" has been updated!`);
    } else {
      newGoals = [updatedGoal, ...goals];
      toast.success(`New goal "${updatedGoal.title}" has been created!`);
    }
    setGoals(newGoals);
    setIsCreateDialogOpen(false);
    setEditingGoal(null);
  };

  const openCreateDialog = () => {
    setEditingGoal(null);
    setIsCreateDialogOpen(true);
  };

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Goals</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Create Goal
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
      <GoalFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onGoalUpdate={handleGoalUpdate}
        goal={editingGoal}
      />
    </PortalLayout>
  );
};

export default GoalsPage;