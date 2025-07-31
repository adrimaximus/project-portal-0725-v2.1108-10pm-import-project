import { useState, useEffect } from 'react';
import { Goal } from '@/data/goals';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import IconPicker from './IconPicker';
import ColorPicker from './ColorPicker';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface GoalDetailProps {
  goal: Goal;
  onUpdate: (updatedGoal: Goal) => void;
  onDelete: (goalId: string) => void;
  onClose?: () => void;
}

const weekDays = [
  { label: 'S', value: '0' },
  { label: 'M', value: '1' },
  { label: 'T', value: '2' },
  { label: 'W', value: '3' },
  { label: 'T', 'value': '4' },
  { label: 'F', value: '5' },
  { label: 'S', value: '6' },
];

const GoalDetail = ({ goal, onUpdate, onDelete, onClose }: GoalDetailProps) => {
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

  const handleUpdate = () => {
    onUpdate({
      ...goal,
      title,
      frequency,
      specificDays: frequency === 'Weekly' ? specificDays.map(Number) : undefined,
      icon,
      color,
    });
  };

  const hasChanges = (() => {
    if (title !== goal.title) return true;
    if (frequency !== goal.frequency) return true;
    if (icon !== goal.icon) return true;
    if (color !== goal.color) return true;

    if (frequency === 'Weekly') {
      const currentDays = specificDays.map(Number).sort((a, b) => a - b);
      const originalDays = (goal.specificDays || []).sort((a, b) => a - b);
      if (currentDays.length !== originalDays.length) return true;
      if (currentDays.some((day, i) => day !== originalDays[i])) return true;
    }
    
    return false;
  })();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Goal</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => onDelete(goal.id)}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete Goal</span>
        </Button>
      </CardHeader>
      <CardContent>
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
              <ColorPicker color={color} setColor={setColor} />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end space-x-2">
        {onClose && <Button variant="ghost" onClick={onClose}>Cancel</Button>}
        <Button onClick={handleUpdate} disabled={!hasChanges}>Save Changes</Button>
      </CardFooter>
    </Card>
  );
};

export default GoalDetail;