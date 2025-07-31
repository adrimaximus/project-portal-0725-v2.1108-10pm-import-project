import { useState } from 'react';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAssignment } from './UserAssignment';

interface GoalDetailProps {
  goal: Goal;
  onUpdate: (updatedGoal: Goal) => void;
  onClose: () => void;
  isCreateMode?: boolean;
}

const GoalDetail = ({ goal, onUpdate, onClose }: GoalDetailProps) => {
  const [title, setTitle] = useState(goal.title);
  const [frequency, setFrequency] = useState(goal.frequency);
  const [assignedUserIds, setAssignedUserIds] = useState(goal.assignedUserIds || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...goal,
      title,
      frequency,
      assignedUserIds,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 py-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="frequency">Frequency</Label>
        <Input
          id="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <UserAssignment 
          selectedUserIds={assignedUserIds}
          onSelectionChange={setAssignedUserIds}
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  );
};

export default GoalDetail;