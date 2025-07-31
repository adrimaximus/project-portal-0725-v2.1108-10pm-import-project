import { useState } from 'react';
import { Goal } from '@/data/goals';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Target, TrendingUp, Users, CheckCircle, Award, BarChart, Activity, Bike, BookOpen, 
  Brain, Calendar, Dumbbell, Flame, Heart, Leaf, Moon, PenTool, Footprints, Smile, Sunrise, Wallet, Zap 
} from "lucide-react";

interface NewGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalCreate: (newGoal: Omit<Goal, 'id' | 'icon' | 'completions' | 'collaborators'> & { icon: string }) => void;
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

const icons = [
  { name: 'Target', component: Target },
  { name: 'TrendingUp', component: TrendingUp },
  { name: 'Users', component: Users },
  { name: 'CheckCircle', component: CheckCircle },
  { name: 'Award', component: Award },
  { name: 'BarChart', component: BarChart },
  { name: 'Activity', component: Activity },
  { name: 'Bike', component: Bike },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Brain', component: Brain },
  { name: 'Calendar', component: Calendar },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'Flame', component: Flame },
  { name: 'Heart', component: Heart },
  { name: 'Leaf', component: Leaf },
  { name: 'Moon', component: Moon },
  { name: 'PenTool', component: PenTool },
  { name: 'Footprints', component: Footprints },
  { name: 'Smile', component: Smile },
  { name: 'Sunrise', component: Sunrise },
  { name: 'Wallet', component: Wallet },
  { name: 'Zap', component: Zap },
];

const colors = ['#4A90E2', '#50E3C2', '#F5A623', '#E02020', '#9013FE', '#BD10E0'];

const NewGoalDialog = ({ open, onOpenChange, onGoalCreate }: NewGoalDialogProps) => {
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<Goal['frequency']>('Daily');
  const [specificDays, setSpecificDays] = useState<string[]>([]);
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('#4A90E2');

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
    setColor('#4A90E2');
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
              <ToggleGroup
                type="single"
                variant="outline"
                value={icon}
                onValueChange={(value) => { if (value) setIcon(value) }}
                className="flex flex-wrap gap-2"
              >
                {icons.map(({ name, component: IconComponent }) => (
                  <ToggleGroupItem key={name} value={name} aria-label={name} className="p-2 h-10 w-10">
                    <IconComponent className="h-5 w-5" style={{ color }} />
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
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