import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Goal } from '@/types';
import GoalFormDialog from '@/components/goals/GoalFormDialog';
import GoalCard from '@/components/goals/GoalCard';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useGoals } from '@/hooks/useGoals';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';

const GoalsPage = () => {
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: goals = [], isLoading } = useGoals();

  const handleSuccess = (newGoal: Goal) => {
    setIsNewGoalDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    navigate(`/goals/${newGoal.slug}`);
  };

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Goals</h1>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" /> New Goal
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Goals</h1>
        <Button onClick={() => setIsNewGoalDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      <GoalFormDialog
        open={isNewGoalDialogOpen}
        onOpenChange={setIsNewGoalDialogOpen}
        onSuccess={handleSuccess}
      />
    </PortalLayout>
  );
};

export default GoalsPage;