import { useState } from 'react';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface GoalDetailProps {
  goal: Goal;
  onUpdate: (goal: Goal) => void;
  onClose?: () => void;
  isCreateMode?: boolean;
}

const colors = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#10B981',
  '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
];

const GoalDetail = ({ goal, onUpdate, onClose, isCreateMode = false }: GoalDetailProps) => {
  const [editedGoal, setEditedGoal] = useState<Goal>(goal);

  const handleSave = () => {
    onUpdate(editedGoal);
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="goal-title">Goal Title</Label>
        <Input
          id="goal-title"
          value={editedGoal.title}
          onChange={(e) => setEditedGoal({ ...editedGoal, title: e.target.value })}
          placeholder="e.g. Read 10 pages"
        />
      </div>
      
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Label>Icon</Label>
          <div className="p-3 mt-1 rounded-lg border flex items-center gap-3 h-10">
            <div className="p-1 rounded-lg" style={{ backgroundColor: `${editedGoal.color}20` }}>
              <editedGoal.icon className="h-5 w-5" style={{ color: editedGoal.color }} />
            </div>
            <p className="text-sm text-muted-foreground">Icon selection coming soon</p>
          </div>
        </div>
        <div>
          <Label>Color</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full mt-1 justify-start px-2 h-10">
                <div className="w-5 h-5 rounded-full mr-2 border" style={{ backgroundColor: editedGoal.color }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-6 gap-1">
                {colors.map(c => (
                  <button
                    key={c}
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: c }}
                    onClick={() => setEditedGoal({ ...editedGoal, color: c })}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="frequency">Frequency</Label>
        <Select
          value={editedGoal.frequency}
          onValueChange={(value) => setEditedGoal({ ...editedGoal, frequency: value })}
        >
          <SelectTrigger id="frequency">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Everyday">Everyday</SelectItem>
            <SelectItem value="5 days per week">5 days per week</SelectItem>
            <SelectItem value="3 days per week">3 days per week</SelectItem>
            <SelectItem value="Once a week">Once a week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-between items-center pt-4 mt-4 border-t">
        <div>
          {!isCreateMode && (
            <Button variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {onClose && <Button variant="ghost" onClick={onClose}>Cancel</Button>}
          <Button onClick={handleSave}>
            {isCreateMode ? 'Create Goal' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GoalDetail;