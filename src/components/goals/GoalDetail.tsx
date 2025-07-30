import { useState, useMemo } from 'react';
import { Goal, dummyIcons } from '@/data/goals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DayOfWeekPicker from './DayOfWeekPicker';

const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#8A2BE2', '#FF9F1C'];
const iconNames = Object.keys(dummyIcons) as (keyof typeof dummyIcons)[];

interface GoalDetailProps {
  goal?: Goal;
  onUpdate: (goal: Goal) => void;
  onClose: () => void;
}

const GoalDetail = ({ goal, onUpdate, onClose }: GoalDetailProps) => {
  const isEditMode = !!goal;
  const [title, setTitle] = useState(goal?.title || '');
  const [frequency, setFrequency] = useState(goal?.frequency || 'Daily');
  const [specificDays, setSpecificDays] = useState<string[]>(goal?.specificDays || []);
  const [color, setColor] = useState(goal?.color || colors[0]);
  const [icon, setIcon] = useState<keyof typeof dummyIcons>(goal?.iconName || iconNames[0]);

  const handleDayToggle = (dayKey: string) => {
    setSpecificDays(prev =>
      prev.includes(dayKey) ? prev.filter(d => d !== dayKey) : [...prev, dayKey]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newGoalData: Goal = {
      ...(goal || { id: '', completions: [] }),
      title,
      frequency,
      specificDays: frequency === 'Specific Days' ? specificDays : [],
      color,
      iconName: icon,
      icon: dummyIcons[icon],
    };
    onUpdate(newGoalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Goal Title</Label>
        <Input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Exercise for 30 minutes"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="frequency">Frequency</Label>
        <Select value={frequency} onValueChange={setFrequency}>
          <SelectTrigger id="frequency">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Daily">Daily</SelectItem>
            <SelectItem value="Specific Days">Specific Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {frequency === 'Specific Days' && (
        <div className="space-y-2">
          <Label>Select Days</Label>
          <DayOfWeekPicker selectedDays={specificDays} onDayToggle={handleDayToggle} />
        </div>
      )}

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2">
          {colors.map(c => (
            <Button
              key={c}
              type="button"
              variant={color === c ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setColor(c)}
              style={{ backgroundColor: c, borderColor: color === c ? 'black' : c }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-2">
          {iconNames.map(iconName => {
            const Icon = dummyIcons[iconName];
            return (
              <Button
                key={iconName}
                type="button"
                variant={icon === iconName ? 'default' : 'outline'}
                size="icon"
                onClick={() => setIcon(iconName)}
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">{isEditMode ? 'Save Changes' : 'Create Goal'}</Button>
      </div>
    </form>
  );
};

export default GoalDetail;