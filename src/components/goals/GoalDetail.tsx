import { useState, useEffect } from 'react';
import { Goal } from '@/data/goals';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import IconPicker from './IconPicker';

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

const colors = ['#4A90E2', '#50E3C2', '#F5A623', '#E02020', '#9013FE', '#BD10E0'];

const GoalDetail = ({ goal, onUpdate, onClose }: GoalDetailProps) => {
  const [title, setTitle] = useState(goal.title);
  const [frequency, setFrequency] = useState<Goal['frequency']>(goal.frequency);
  const [specificDays, setSpecificDays] = useState<string[]>(goal.specificDays?.map(String) || []);
  const [icon, setIcon] = useState(goal.icon);
  const [color, setColor] = useState(goal.color);

  useEffect(() => {
    setTitle(goal.title);
    setFrequency(goal.frequency);
    setSpecificDays(goal.specificDays?.map(String) || []);
    setIcon(goal.icon);
    setColor(goal.color);
  }, [goal]);

  const handleSave = () => {
    const updatedGoal: Goal = {
      ...goal,
      title,
      frequency,
      specificDays: frequency === 'Weekly' ? specificDays.map(Number) : undefined,
      icon,
      color,
    };
    onUpdate(updatedGoal);
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
      <div className="grid grid-cols-4 items-start gap-4">
        <Label className="text-right pt-2">Icon</Label>
        <div className="col-span-3">
          <IconPicker value={icon} onChange={setIcon} color={color} />
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Color</Label>
        <div className="col-span-3">
          <ToggleGroup
            type="single"
            variant="outline"
            value={color}
            onValueChange={(value) => { if (value) setColor(value) }}
            className="flex flex-wrap gap-2"
          >
            {colors.map((c) => (
              <ToggleGroupItem key={c} value={c} aria-label={c} className="p-0 h-8 w-8 rounded-full border-2 border-transparent data-[state=on]:border-ring">
                <div className="h-full w-full rounded-full" style={{ backgroundColor: c }}></div>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
};

export default GoalDetail;