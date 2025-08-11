import { useState, useEffect } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Goal } from '@/types';
import GoalFormDialog from '@/components/goals/GoalFormDialog';
import GoalCard from '@/components/goals/GoalCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_goals');
      if (error) {
        toast.error("Failed to fetch goals.");
        console.error(error);
      } else {
        setGoals(data as Goal[]);
      }
      setLoading(false);
    };

    fetchGoals();
  }, [user]);

  const handleGoalSaved = (savedGoal: Goal) => {
    setGoals(prevGoals => {
      const index = prevGoals.findIndex(g => g.id === savedGoal.id);
      if (index !== -1) {
        const newGoals = [...prevGoals];
        newGoals[index] = savedGoal;
        return newGoals;
      } else {
        return [savedGoal, ...prevGoals];
      }
    });
  };

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Goals</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Goal
        </Button>
      </div>

      {loading ? (
        <p>Loading goals...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      <GoalFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onGoalSaved={handleGoalSaved}
      />
    </PortalLayout>
  );
}