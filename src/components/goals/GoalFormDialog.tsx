import { useState, useEffect } from 'react';
import { Goal, GoalType, GoalPeriod, Tag, DayOfWeek } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import TagInput from './TagInput';
import { getIconComponent, allIcons } from '@/data/icons';
import { colors } from '@/data/colors';

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalSaved: (goal: Goal) => void;
  goalToEdit?: Goal | null;
}

const weekDays: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function GoalFormDialog({ open, onOpenChange, onGoalSaved, goalToEdit }: GoalFormDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('#3b82f6');
  const [type, setType] = useState<GoalType>('quantity');
  const [targetQuantity, setTargetQuantity] = useState<number | ''>('');
  const [targetValue, setTargetValue] = useState<number | ''>('');
  const [unit, setUnit] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'specific_days'>('daily');
  const [specificDays, setSpecificDays] = useState<DayOfWeek[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title);
      setDescription(goalToEdit.description || '');
      setIcon(goalToEdit.icon);
      setColor(goalToEdit.color);
      setType(goalToEdit.type);
      setTargetQuantity(goalToEdit.target_quantity || '');
      setTargetValue(goalToEdit.target_value || '');
      setUnit(goalToEdit.unit || '');
      setFrequency(goalToEdit.frequency || 'daily');
      setSpecificDays(goalToEdit.specific_days || []);
      setTags(goalToEdit.tags || []);
    } else {
      // Reset form
      setTitle('');
      setDescription('');
      setIcon('Target');
      setColor('#3b82f6');
      setType('quantity');
      setTargetQuantity('');
      setTargetValue('');
      setUnit('');
      setFrequency('daily');
      setSpecificDays([]);
      setTags([]);
    }
  }, [goalToEdit, open]);

  useEffect(() => {
    const fetchTags = async () => {
      if (!user) return;
      const { data, error } = await supabase.from('tags').select('*').eq('user_id', user.id);
      if (error) {
        toast.error("Failed to load tags.");
      } else {
        setAllTags(data);
      }
    };
    fetchTags();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      toast.error("You must be logged in to save a goal.");
      return;
    }
    if (!title) {
      toast.error("Title is required.");
      return;
    }
    setIsSaving(true);

    const goalData = {
      user_id: user.id,
      title,
      description,
      icon,
      color,
      type,
      target_quantity: type === 'quantity' ? Number(targetQuantity) || null : null,
      target_value: type === 'value' ? Number(targetValue) || null : null,
      unit: type === 'value' ? unit : null,
      frequency,
      specific_days: frequency === 'specific_days' ? specificDays : null,
    };

    let savedGoal;
    if (goalToEdit) {
      const { data, error } = await supabase.from('goals').update(goalData).eq('id', goalToEdit.id).select().single();
      if (error) {
        toast.error(`Failed to update goal: ${error.message}`);
        setIsSaving(false);
        return;
      }
      savedGoal = data;
    } else {
      const { data, error } = await supabase.from('goals').insert(goalData).select().single();
      if (error) {
        toast.error(`Failed to create goal: ${error.message}`);
        setIsSaving(false);
        return;
      }
      savedGoal = data;
    }

    // Handle tags
    const { error: deleteError } = await supabase.from('goal_tags').delete().eq('goal_id', savedGoal.id);
    if (deleteError) {
      toast.error(`Failed to update tags: ${deleteError.message}`);
    } else {
      const newGoalTags = tags.map(t => ({ goal_id: savedGoal.id, tag_id: t.id }));
      const { error: insertError } = await supabase.from('goal_tags').insert(newGoalTags);
      if (insertError) {
        toast.error(`Failed to save tags: ${insertError.message}`);
      }
    }

    // Refetch the full goal to return
    const { data: fullGoal, error: fetchError } = await supabase.rpc('get_user_goals').eq('id', savedGoal.id).single();
    if (fetchError) {
        toast.error("Could not refetch the saved goal.");
    } else {
        onGoalSaved(fullGoal as Goal);
    }

    setIsSaving(false);
    onOpenChange(false);
  };

  const IconComponent = getIconComponent(icon);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{goalToEdit ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input placeholder="Goal Title (e.g., Read 52 books)" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Icon</label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <IconComponent style={{ color }} />
                      {icon}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {allIcons.map(iconName => {
                    const ListItemIcon = getIconComponent(iconName);
                    return (
                      <SelectItem key={iconName} value={iconName}>
                        <div className="flex items-center gap-2">
                          <ListItemIcon />
                          {iconName}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">Color</label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quantity">Quantity (e.g., complete 10 times)</SelectItem>
                <SelectItem value="value">Value (e.g., save $1000)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'quantity' && (
            <div className="space-y-4">
              <Input type="number" placeholder="Target Quantity" value={targetQuantity} onChange={e => setTargetQuantity(Number(e.target.value))} />
              <div>
                <label className="text-sm font-medium">Frequency</label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as 'daily' | 'specific_days')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="specific_days">Specific Days of the Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {frequency === 'specific_days' && (
                <div>
                  <label className="text-sm font-medium">On these days</label>
                  <ToggleGroup type="multiple" value={specificDays} onValueChange={(v: DayOfWeek[]) => setSpecificDays(v)} className="mt-2 justify-start">
                    {weekDays.map(day => (
                      <ToggleGroupItem key={day} value={day}>{day}</ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )}
            </div>
          )}

          {type === 'value' && (
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" placeholder="Target Value" value={targetValue} onChange={e => setTargetValue(Number(e.target.value))} />
              <Input placeholder="Unit (e.g., USD, EUR)" value={unit} onChange={e => setUnit(e.target.value)} />
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Tags</label>
            <TagInput value={tags} onChange={setTags} allTags={allTags} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Goal'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}