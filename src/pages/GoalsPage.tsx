import { useState, useEffect, useCallback, useMemo } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { Goal } from '@/types';
import GoalFormDialog from '@/components/goals/GoalFormDialog';
import GoalCard from '@/components/goals/GoalCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import GoalsTableView from '@/components/goals/GoalsTableView';

const GoalsPage = () => {
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc('get_user_goals');
    if (error) {
      toast.error('Failed to fetch goals.');
      console.error(error);
    } else {
      setGoals(data || []);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const { specialGoals, otherGoals } = useMemo(() => {
    const specialTags = ['office', '7inked', 'betterworks.id'];
    const sGoals: Goal[] = [];
    const oGoals: Goal[] = [];

    if (goals) {
      goals.forEach(goal => {
        const hasSpecialTag = goal.tags && goal.tags.some(tag => specialTags.includes(tag.name.toLowerCase()));
        if (hasSpecialTag) {
          sGoals.push(goal);
        } else {
          oGoals.push(goal);
        }
      });
    }
    return { specialGoals: sGoals, otherGoals: oGoals };
  }, [goals]);

  const handleSuccess = (newGoal: Goal) => {
    setIsNewGoalDialogOpen(false);
    navigate(`/goals/${newGoal.slug}`);
    fetchGoals();
  };

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Goals</h1>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => { if (value) setViewMode(value as 'card' | 'table')}}>
            <ToggleGroupItem value="card" aria-label="Card view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <TableIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={() => setIsNewGoalDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Goal
          </Button>
        </div>
      </div>

      {viewMode === 'card' ? (
        <>
          {specialGoals.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Team Goals</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {specialGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}
          {otherGoals.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Personal Goals</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {otherGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            </div>
          )}
          {goals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>You haven't created any goals yet.</p>
              <p>Click "New Goal" to get started!</p>
            </div>
          )}
        </>
      ) : (
        <GoalsTableView goals={goals} />
      )}

      <GoalFormDialog
        open={isNewGoalDialogOpen}
        onOpenChange={setIsNewGoalDialogOpen}
        onSuccess={handleSuccess}
      />
    </PortalLayout>
  );
};

export default GoalsPage;