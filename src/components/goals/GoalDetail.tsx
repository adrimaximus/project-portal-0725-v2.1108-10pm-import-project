import { useState } from 'react';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface GoalDetailProps {
  goal: Goal;
  onUpdate: (goal: Goal) => void;
  onClose: () => void;
}

const colors = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#10B981',
  '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
];

const GoalDetail = ({ goal, onUpdate, onClose }: GoalDetailProps) => {
  const [editedGoal, setEditedGoal] = useState<Goal>(goal);

  const handleSave = () => {
    onUpdate(editedGoal);
  };

  return (
    <div className="flex flex-col h-full border-l bg-background">
      <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
        <h2 className="text-lg font-semibold">Goal Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <Label htmlFor="goal-title">Goal Title</Label>
          <Input
            id="goal-title"
            value={editedGoal.title}
            onChange={(e) => setEditedGoal({ ...editedGoal, title: e.target.value })}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label>Icon</Label>
            <div className="p-3 mt-1 rounded-lg border flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${editedGoal.color}20` }}>
                <editedGoal.icon className="h-6 w-6" style={{ color: editedGoal.color }} />
              </div>
              <p className="text-sm text-muted-foreground">Icon selection coming soon</p>
            </div>
          </div>
          <div>
            <Label>Color</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full mt-1 justify-start px-2">
                  <div className="w-5 h-5 rounded-full mr-2 border" style={{ backgroundColor: editedGoal.color }} />
                  <span className="flex-1">Select</span>
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

        <div>
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
      </div>
      <footer className="p-4 border-t flex items-center justify-between sticky bottom-0 bg-background z-10">
        <Button variant="outline">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </footer>
    </div>
  );
};

export default GoalDetail;