import { useState, useEffect } from 'react';
import { Goal } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoalDetailProps {
  goal: Goal;
  onGoalUpdate: (updatedGoal: Goal) => void;
}

const GoalDetail = ({ goal, onGoalUpdate }: GoalDetailProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState(goal);

  useEffect(() => {
    setEditedGoal(goal);
  }, [goal]);

  const handleUpdate = async () => {
    const { data, error } = await supabase
      .from('goals')
      .update({
        title: editedGoal.title,
        description: editedGoal.description,
      })
      .eq('id', goal.id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update goal');
    } else {
      toast.success('Goal updated');
      onGoalUpdate(data as Goal);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div>
        <Input
          value={editedGoal.title}
          onChange={(e) => setEditedGoal({ ...editedGoal, title: e.target.value })}
          className="text-2xl font-bold mb-2"
        />
        <Textarea
          value={editedGoal.description || ''}
          onChange={(e) => setEditedGoal({ ...editedGoal, description: e.target.value })}
          className="text-lg text-muted-foreground"
        />
        <div className="mt-4 space-x-2">
          <Button onClick={handleUpdate}>Save</Button>
          <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{goal.title}</h1>
      <p className="text-lg text-muted-foreground">{goal.description}</p>
      <Button variant="outline" onClick={() => setIsEditing(true)} className="mt-4">
        Edit
      </Button>
    </div>
  );
};

export default GoalDetail;