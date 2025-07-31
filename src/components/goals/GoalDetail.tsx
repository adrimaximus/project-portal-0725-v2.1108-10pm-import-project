import { useState } from 'react';
import { Goal } from '@/data/goals';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DialogFooter } from '../ui/dialog';

interface GoalDetailProps {
  goal: Goal;
  onUpdate: (updatedGoal: Goal) => void;
  onClose: () => void;
}

const weekDays = [
  { label: 'S', value: '0' },
  { label: 'M', value: '1' },
  { label: 'T', value: '2' },
  { label: 'W', value: '3' },
  { label: 'T', value: '4' },
  { label: 'F', value: '5' },
  { label: 'S', value: '6' },
];

const GoalDetail = ({ goal, onUpdate, onClose }: GoalDetailProps) => {
  const [title, setTitle] = useState(goal.title);
  const [frequency, setFrequency] = useState<Goal['frequency']>(goal.frequency);
  const [specificDays, setSpecificDays] = useState<string[]>(goal.specificDays?.map(String) || []);

  const handleSave = () => {
    onUpdate({
      ...goal,
      title,
      frequency,
      specificDays: frequency === 'Weekly' ? specificDays.map(Number) : undefined,
    });
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">
          Title
        </Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="frequency" className="text-right">
          Frequency
        </Label>
        <Select value={frequency} onValueChange={(value) => setFrequency(value as Goal['frequency'])}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Daily">Daily</SelectItem>
            <SelectItem value="Weekly">Weekly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {frequency === 'Weekly' && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Days</Label>
          <ToggleGroup
            type="multiple"
            variant="outline"
            value={specificDays}
            onValueChange={setSpecificDays}
            className="col-span-3 justify-start"
          >
            {weekDays.map(day => (
              <ToggleGroupItem key={day.value} value={day.value} aria-label={day.label}>
                {day.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </DialogFooter>
    </div>
  );
};

export default GoalDetail;