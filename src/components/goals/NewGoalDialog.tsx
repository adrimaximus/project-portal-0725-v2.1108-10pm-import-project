import { useState } from 'react';
import { Goal } from '@/data/goals';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import IconPicker from './IconPicker';
import ColorPicker from './ColorPicker';

interface NewGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalCreate: (newGoal: Omit<Goal, 'id' | 'completions' | 'collaborators'>) => void;
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

const NewGoalDialog = ({ open, onOpenChange, onGoalCreate }: NewGoalDialogProps) => {
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<Goal['frequency']>('Daily');
  const [specificDays, setSpecificDays] = useState<string[]>([]);
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('#BFDBFE');

  const handleSave = () => {
    if (!title) return;
    onGoalCreate({
      title,
      frequency,
      specificDays: frequency === 'Weekly' ? specificDays.map(Number) : undefined,
      icon,
      color,
    });
    setTitle('');
    setFrequency('Daily');
    setSpecificDays([]);
    setIcon('Target');
    setColor('#BFDBFE');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Goal</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="e.g., Drink more water" />
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
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Create Goal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewGoalDialog;