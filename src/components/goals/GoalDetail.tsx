import { useState, useEffect } from 'react';
import { Goal } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TagInput } from '@/components/ui/TagInput';
import { allIcons, getIconComponent } from '@/data/icons';
import { colors } from '@/data/colors';

type EditableGoal = Goal & { tags?: string[] };

interface GoalDetailProps {
  goal: EditableGoal;
  onUpdate: (goal: EditableGoal) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const GoalDetail = ({ goal, onUpdate, onDelete, onClose }: GoalDetailProps) => {
  const [editedGoal, setEditedGoal] = useState<EditableGoal>(goal);

  useEffect(() => {
    setEditedGoal(goal);
  }, [goal]);

  const handleChange = (field: keyof EditableGoal, value: any) => {
    setEditedGoal(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(editedGoal);
  };

  const Icon = getIconComponent(editedGoal.icon);

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">
          Title
        </Label>
        <Input
          id="title"
          value={editedGoal.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="frequency" className="text-right">
          Frequency
        </Label>
        <Select
          value={editedGoal.frequency}
          onValueChange={(value) => handleChange('frequency', value)}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Daily">Daily</SelectItem>
            <SelectItem value="Weekly">Weekly</SelectItem>
            <SelectItem value="Monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Icon & Color</Label>
        <div className="col-span-3 flex gap-2">
          <Select value={editedGoal.icon} onValueChange={(value) => handleChange('icon', value)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <span>{allIcons.find(i => i === editedGoal.icon)}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {allIcons.map(icon => {
                const OptIcon = getIconComponent(icon);
                return (
                  <SelectItem key={icon} value={icon}>
                    <div className="flex items-center gap-2">
                      <OptIcon className="h-5 w-5" /> {icon}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Select value={editedGoal.color} onValueChange={(value) => handleChange('color', value)}>
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: editedGoal.color }} />
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {colors.map(color => (
                <SelectItem key={color} value={color}>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
                    {color}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="tags" className="text-right">
          Tags
        </Label>
        <div className="col-span-3">
          <TagInput
            value={editedGoal.tags || []}
            onChange={(tags) => handleChange('tags', tags)}
            placeholder="Add tags and press Enter"
          />
        </div>
      </div>
      <div className="flex justify-between items-center pt-4 mt-4 border-t">
        <Button variant="destructive" onClick={() => onDelete(editedGoal.id)}>
          Delete Goal
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default GoalDetail;