import { useState } from 'react';
import { Goal } from '@/data/goals';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ColorPicker from './ColorPicker';
import { Textarea } from '@/components/ui/textarea';
import { TagInput } from './TagInput';
import { Tag, dummyTags } from '@/data/tags';
import { v4 as uuidv4 } from 'uuid';

interface NewGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalCreate: (newGoal: Omit<Goal, 'id' | 'completions' | 'collaborators'>) => void;
}

const weekDays = [
  { label: 'S', value: 'Su' },
  { label: 'M', value: 'Mo' },
  { label: 'T', value: 'Tu' },
  { label: 'W', value: 'We' },
  { label: 'T', value: 'Th' },
  { label: 'F', value: 'Fr' },
  { label: 'S', value: 'Sa' },
];

const NewGoalDialog = ({ open, onOpenChange, onGoalCreate }: NewGoalDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<Goal['frequency']>('Daily');
  const [specificDays, setSpecificDays] = useState<string[]>([]);
  const [color, setColor] = useState('#BFDBFE');
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>(dummyTags);

  const handleTagCreate = (tagName: string): Tag => {
    const newTag: Tag = {
      id: uuidv4(),
      name: tagName,
      color: color,
    };
    setAllTags(prev => [...prev, newTag]);
    return newTag;
  };

  const handleSave = () => {
    if (!title) return;
    onGoalCreate({
      title,
      description,
      frequency,
      specificDays: frequency === 'Weekly' ? specificDays : [],
      icon: '🎯', // Set default icon
      color,
      tags,
    });
    setTitle('');
    setDescription('');
    setFrequency('Daily');
    setSpecificDays([]);
    setColor('#BFDBFE');
    setTags([]);
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
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Why is this goal important?" />
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Color</Label>
            <div className="col-span-3">
              <ColorPicker color={color} setColor={setColor} />
            </div>
          </div>
           <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Tags</Label>
            <div className="col-span-3">
              <TagInput
                allTags={allTags}
                selectedTags={tags}
                onTagsChange={setTags}
                onTagCreate={handleTagCreate}
              />
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