import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useGoals } from '@/context/GoalsContext';
import { toast } from 'sonner';

const iconOptions = ['📚', '🏃', '🎸', '💧', '🧘', '🎨', '💻', '💰', '✈️'];
const colorOptions = ['#3B82F6', '#10B981', '#F59E0B', '#0EA5E9', '#8B5CF6', '#EF4444', '#6366F1', '#F97316'];
const dayOptions = [
  { value: 'Su', label: 'S' },
  { value: 'Mo', label: 'M' },
  { value: 'Tu', label: 'T' },
  { value: 'We', label: 'W' },
  { value: 'Th', label: 'T' },
  { value: 'Fr', label: 'F' },
  { value: 'Sa', label: 'S' },
];

const NewGoalDialog = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const { addGoal } = useGoals();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState(iconOptions[0]);
  const [color, setColor] = useState(colorOptions[0]);
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly'>('Daily');
  const [specificDays, setSpecificDays] = useState<string[]>([]);
  const [tags, setTags] = useState('');

  const handleSubmit = () => {
    if (!title) {
      toast.error('Please enter a title for your goal.');
      return;
    }

    addGoal({
      title,
      description,
      icon,
      color,
      frequency,
      specificDays: frequency === 'Weekly' ? specificDays : [],
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    });

    toast.success(`New goal "${title}" has been created!`);
    setOpen(false);
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create New Goal</DialogTitle>
        <DialogDescription>Set up a new goal to track your progress. Click save when you're done.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="title" className="text-right">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">Description</Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Icon & Color</Label>
          <div className="col-span-3 flex gap-2">
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger className="w-[80px]">
                <SelectValue>{icon}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger className="flex-1">
                <SelectValue asChild>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                    {color}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: opt }} />
                      {opt}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="frequency" className="text-right">Frequency</Label>
          <div className="col-span-3">
            <Select value={frequency} onValueChange={(v: 'Daily' | 'Weekly') => setFrequency(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {frequency === 'Weekly' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Days</Label>
            <div className="col-span-3">
              <ToggleGroup type="multiple" value={specificDays} onValueChange={setSpecificDays} variant="outline" className="flex-wrap justify-start">
                {dayOptions.map(day => (
                  <ToggleGroupItem key={day.value} value={day.value} aria-label={day.value}>{day.label}</ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        )}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="tags" className="text-right">Tags</Label>
          <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="col-span-3" placeholder="e.g. Health, Fitness" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit" onClick={handleSubmit}>Save Goal</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default NewGoalDialog;