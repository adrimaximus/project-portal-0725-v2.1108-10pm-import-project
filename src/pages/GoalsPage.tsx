import { useState, useEffect } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Goal } from '@/types';
import GoalFormDialog from '@/components/goals/GoalFormDialog';
import GoalCard from '@/components/goals/GoalCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const GoalsPage = () => {
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchGoals = async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc('get_user_goals');
    if (error) {
      toast.error('Failed to fetch goals.');
      console.error(error);
    } else {
      setGoals(data || []);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const handleSuccess = (newGoal: Goal) => {
    setIsNewGoalDialogOpen(false);
    navigate(`/goals/${newGoal.slug}`);
    fetchGoals();
  };

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