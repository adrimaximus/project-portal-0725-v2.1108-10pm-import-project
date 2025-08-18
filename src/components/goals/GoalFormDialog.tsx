import { useState, useEffect } from 'react';
import { Goal, GoalType, GoalPeriod, Tag } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ColorPicker from './ColorPicker';
import { Textarea } from '@/components/ui/textarea';
import { TagInput } from './TagInput';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import IconPicker from './IconPicker';
import { colors as tagColors } from '@/data/colors';

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newGoal: any) => void;
  onGoalUpdate?: (updatedGoal: Goal) => void;
  goal?: Goal | null;
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

const GoalFormDialog = ({ open, onOpenChange, onSuccess, onGoalUpdate, goal }: GoalFormDialogProps) => {
  const isEditMode = !!goal;
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<GoalType>('frequency');
  const [frequency, setFrequency] = useState<Goal['frequency']>('Daily');
  const [specificDays, setSpecificDays] = useState<string[]>([]);
  const [targetQuantity, setTargetQuantity] = useState<number | undefined>(undefined);
  const [targetPeriod, setTargetPeriod] = useState<GoalPeriod>('Monthly');
  const [targetValue, setTargetValue] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState<string>('');
  const [color, setColor] = useState('#141414');
  const [icon, setIcon] = useState('Target');
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
        if (!user) return;
        const { data } = await supabase.from('tags').select('*').or(`user_id.eq.${user.id},user_id.is.null`);
        if (data) setAllTags(data);
    };

    if (open) {
      fetchTags();
      if (isEditMode && goal) {
        setTitle(goal.title);
        setDescription(goal.description || '');
        setType(goal.type);
        setFrequency(goal.frequency);
        setSpecificDays(goal.specific_days);
        setTargetQuantity(goal.target_quantity);
        setTargetPeriod(goal.target_period || 'Monthly');
        setTargetValue(goal.target_value);
        setUnit(goal.unit || '');
        setColor(goal.color);
        setIcon(goal.icon);
        setTags(goal.tags);
      } else {
        setTitle('');
        setDescription('');
        setType('frequency');
        setFrequency('Daily');
        setSpecificDays([]);
        setTargetQuantity(undefined);
        setTargetPeriod('Monthly');
        setUnit('');
        setColor('#141414');
        setIcon('Target');
        setTags([]);
      }
    }
  }, [goal, open, isEditMode, user]);

  const handleTagCreate = (tagName: string): Tag => {
    const randomColor = tagColors[Math.floor(Math.random() * tagColors.length)];
    const newTag: Tag = {
      id: uuidv4(),
      name: tagName,
      color: randomColor,
    };
    setAllTags(prev => [...prev, newTag]);
    return newTag;
  };

  const handleSave = async () => {
    if (!title) {
      toast.error("Please enter a title for your goal.");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to create a goal.");
      return;
    }
    
    setIsSaving(true);

    if (isEditMode && onGoalUpdate && goal) {
      const updatedGoalData: Goal = {
        ...goal,
        title, description, type, frequency,
        specific_days: type === 'frequency' && frequency === 'Weekly' ? specificDays : [],
        target_quantity: targetQuantity, 
        target_period: targetPeriod, 
        target_value: targetValue, 
        unit, color, tags,
        icon,
        icon_url: undefined,
      };
      onGoalUpdate(updatedGoalData);
      setIsSaving(false);
    } else if (!isEditMode) {
      try {
        const goalPayload = {
          title,
          description,
          icon,
          color,
          type,
          frequency,
          specific_days: type === 'frequency' && frequency === 'Weekly' ? specificDays : [],
          target_quantity: targetQuantity,
          target_period: targetPeriod,
          target_value: targetValue,
          unit,
          tags: tags.map(t => ({ name: t.name, color: t.color })),
        };

        const { data: newGoal, error: goalError } = await supabase.functions.invoke(
          'secure-create-goal',
          { body: goalPayload }
        );

        if (goalError) throw goalError;

        toast.success(`Goal "${newGoal.title}" created!`);
        onSuccess(newGoal);
        onOpenChange(false);
      } catch (error: any) {
        toast.error(`Failed to create goal: ${error.message}`);
        console.error("Goal creation failed:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleNumericInputChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: (value: number | undefined) => void
  ) => {
    const rawValue = e.target.value;
    const sanitizedValue = rawValue.replace(/,/g, '');

    if (sanitizedValue === '') {
      setter(undefined);
      return;
    }

    const numValue = parseInt(sanitizedValue, 10);
    if (!isNaN(numValue)) {
      setter(numValue);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isSaving && onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Goal' : 'Create a New Goal'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" placeholder="e.g., Drink more water" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="Why is this goal important?" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Type</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as GoalType)} className="col-span-3 flex gap-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value="frequency" id="r1" /><Label htmlFor="r1">Frequency</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="quantity" id="r2" /><Label htmlFor="r2">Quantity</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="value" id="r3" /><Label htmlFor="r3">Value</Label></div>
            </RadioGroup>
          </div>
          {type === 'frequency' ? (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right">Frequency</Label>
                <Select value={frequency} onValueChange={(value) => setFrequency(value as Goal['frequency'])}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {frequency === 'Weekly' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Days</Label>
                  <ToggleGroup type="multiple" variant="outline" value={specificDays} onValueChange={setSpecificDays} className="col-span-3 justify-start">
                    {weekDays.map(day => (
                      <ToggleGroupItem key={day.value} value={day.value} aria-label={day.label}>{day.label}</ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )}
            </>
          ) : type === 'quantity' ? (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target-quantity" className="text-right">Target</Label>
                <Input
                  id="target-quantity"
                  type="text"
                  inputMode="numeric"
                  value={targetQuantity !== undefined ? new Intl.NumberFormat('en-US').format(targetQuantity) : ''}
                  onChange={(e) => handleNumericInputChange(e, setTargetQuantity)}
                  className="col-span-3"
                  placeholder="e.g., 300"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Period</Label>
                <Select value={targetPeriod} onValueChange={(value) => setTargetPeriod(value as GoalPeriod)}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select period" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Per Week</SelectItem>
                    <SelectItem value="Monthly">Per Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target-value" className="text-right">Target Value</Label>
                <Input
                  id="target-value"
                  type="text"
                  inputMode="numeric"
                  value={targetValue !== undefined ? new Intl.NumberFormat('en-US').format(targetValue) : ''}
                  onChange={(e) => handleNumericInputChange(e, setTargetValue)}
                  className="col-span-3"
                  placeholder="e.g., 500"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">Unit</Label>
                <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="col-span-3" placeholder="e.g., USD, km, pages" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Period</Label>
                <Select value={targetPeriod} onValueChange={(value) => setTargetPeriod(value as GoalPeriod)}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select period" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Per Week</SelectItem>
                    <SelectItem value="Monthly">Per Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Icon & Color</Label>
            <div className="col-span-3 space-y-2">
              <IconPicker value={icon} onChange={setIcon} color={color} />
              <ColorPicker color={color} setColor={setColor} />
            </div>
          </div>
           <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Tags</Label>
            <div className="col-span-3">
              <TagInput allTags={allTags} selectedTags={tags} onTagsChange={setTags} onTagCreate={handleTagCreate} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Create Goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GoalFormDialog;