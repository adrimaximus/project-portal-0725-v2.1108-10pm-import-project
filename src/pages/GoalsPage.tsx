import { useState, useEffect } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Goal, Tag } from '@/types';
import GoalFormDialog from '@/components/goals/GoalFormDialog';
import GoalCard from '@/components/goals/GoalCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GoalsPage = () => {
  const [isNewGoalDialogOpen, setIsNewGoalDialogOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const { user } = useAuth();

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

  const handleGoalCreate = async (newGoalData: Omit<Goal, 'id' | 'slug' | 'completions' | 'collaborators'>) => {
    if (!user) {
      const err = new Error("User not authenticated.");
      toast.error(err.message);
      throw err;
    }

    const { tags, ...goalInsertData } = newGoalData;

    // 1. Insert the main goal
    const { data: newGoal, error: goalError } = await supabase
      .from('goals')
      .insert({ ...goalInsertData, user_id: user.id })
      .select()
      .single();

    if (goalError) {
      toast.error('Failed to create goal.');
      console.error(goalError);
      throw goalError;
    }

    // 2. Handle tags
    if (tags && tags.length > 0) {
      const { data: existingTagsData } = await supabase.from('tags').select('name').eq('user_id', user.id);
      const existingTagNames = new Set(existingTagsData?.map(t => t.name));
      
      const newTagsToCreate = tags.filter(t => !existingTagNames.has(t.name));
      
      if (newTagsToCreate.length > 0) {
        const newTagsForDb = newTagsToCreate.map(t => ({ name: t.name, color: t.color, user_id: user.id }));
        await supabase.from('tags').insert(newTagsForDb);
      }

      const { data: allRelevantTags } = await supabase.from('tags').select('id, name').in('name', tags.map(t => t.name));

      if (allRelevantTags) {
        const goalTagsToInsert = allRelevantTags.map(t => ({
          goal_id: newGoal.id,
          tag_id: t.id,
        }));
        await supabase.from('goal_tags').insert(goalTagsToInsert);
      }
    }

    toast.success(`Goal "${newGoal.title}" created!`);
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
        onGoalCreate={handleGoalCreate}
      />
    </PortalLayout>
  );
};

export default GoalsPage;