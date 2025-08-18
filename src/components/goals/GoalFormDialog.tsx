import { useState, useEffect, useCallback } from 'react';
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
import { colors } from '@/data/colors';
import { allIcons } from '@/data/icons';
import { useQueryClient } from '@tanstack/react-query';

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newGoal: any) => void;
  goal?: Goal | null;
}

const weekDays = [
  { label: 'S', value: 'Su' }, { label: 'M', value: 'Mo' }, { label: 'T', value: 'Tu' },
  { label: 'W', value: 'We' }, { label: 'T', value: 'Th' }, { label: 'F', value: 'Fr' },
  { label: 'S', value: 'Sa' },
];

const GoalFormDialog = ({ open, onOpenChange, onSuccess, goal }: GoalFormDialogProps) => {
  const isEditMode = !!goal;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '', description: '', type: 'frequency' as GoalType,
    frequency: 'Daily' as Goal['frequency'], specificDays: [] as string[],
    targetQuantity: undefined as number | undefined, targetPeriod: 'Monthly' as GoalPeriod,
    targetValue: undefined as number | undefined, unit: '', color: '#141414',
    icon: 'Target', tags: [] as Tag[],
  });
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTags = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('tags').select('*').or(`user_id.eq.${user.id},user_id.is.null`);
    if (data) setAllTags(data);
  }, [user]);

  useEffect(() => {
    if (open) {
      fetchTags();
      if (isEditMode && goal) {
        setFormData({
          title: goal.title, description: goal.description || '', type: goal.type,
          frequency: goal.frequency, specificDays: goal.specific_days || [],
          targetQuantity: goal.target_quantity, targetPeriod: goal.target_period || 'Monthly',
          targetValue: goal.target_value, unit: goal.unit || '', color: goal.color,
          icon: goal.icon, tags: goal.tags || [],
        });
      } else {
        const randomIcon = allIcons[Math.floor(Math.random() * allIcons.length)];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        setFormData({
          title: '', description: '', type: 'frequency', frequency: 'Daily',
          specificDays: [], targetQuantity: undefined, targetPeriod: 'Monthly',
          targetValue: undefined, unit: '', color: randomColor, icon: randomIcon, tags: [],
        });
      }
    }
  }, [goal, open, isEditMode, user, fetchTags]);

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagCreate = (tagName: string): Tag => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newTag: Tag = { id: uuidv4(), name: tagName, color: randomColor, isNew: true };
    setAllTags(prev => [...prev, newTag]);
    return newTag;
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error("Please enter a title for your goal.");
      return;
    }
    if (!user) {
      toast.error("You must be logged in to create a goal.");
      return;
    }
    
    setIsSaving(true);

    try {
      if (isEditMode && goal) {
        const newTags = formData.tags.filter(t => t.isNew);
        const existingTagIds = formData.tags.filter(t => !t.isNew).map(t => t.id);
        const { tags, ...restOfFormData } = formData;
        
        const { error } = await supabase
          .rpc('update_goal_with_tags', {
            p_goal_id: goal.id,
            p_title: restOfFormData.title,
            p_description: restOfFormData.description,
            p_icon: restOfFormData.icon,
            p_color: restOfFormData.color,
            p_type: restOfFormData.type,
            p_frequency: restOfFormData.frequency,
            p_specific_days: restOfFormData.specificDays,
            p_target_quantity: restOfFormData.targetQuantity,
            p_target_period: restOfFormData.targetPeriod,
            p_target_value: restOfFormData.targetValue,
            p_unit: restOfFormData.unit,
            p_tags: existingTagIds,
            p_custom_tags: newTags.map(({ name, color }) => ({ name, color })),
          });

        if (error) throw error;
        toast.success("Goal updated successfully.");
        queryClient.invalidateQueries({ queryKey: ['goal', goal.slug] });
        queryClient.invalidateQueries({ queryKey: ['goals'] });
        onSuccess(goal);
      } else {
        const { tags, ...restOfFormData } = formData;
        const existingTagIds = tags.filter(t => !t.isNew && t.id).map(t => t.id);
        const newCustomTags = tags.filter(t => t.isNew).map(({ name, color }) => ({ name, color }));

        const rpcParams = {
            p_title: restOfFormData.title,
            p_description: restOfFormData.description || null,
            p_icon: restOfFormData.icon,
            p_color: restOfFormData.color,
            p_type: restOfFormData.type,
            p_frequency: restOfFormData.frequency || null,
            p_specific_days: restOfFormData.specificDays.length > 0 ? restOfFormData.specificDays : null,
            p_target_quantity: restOfFormData.targetQuantity ?? null,
            p_target_period: restOfFormData.targetPeriod || null,
            p_target_value: restOfFormData.targetValue ?? null,
            p_unit: restOfFormData.unit || null,
            p_existing_tags: existingTagIds,
            p_custom_tags: newCustomTags,
        };

        const { data: newGoal, error: rpcError } = await supabase
          .rpc('create_goal_and_link_tags', rpcParams)
          .single();

        if (rpcError) throw rpcError;
        if (!newGoal) throw new Error("Goal creation did not return the new goal data.");

        toast.success(`Goal "${(newGoal as Goal).title}" created!`);
        onSuccess(newGoal);
      }
    } catch (error: any) {
      toast.error(`Failed to save goal: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'targetQuantity' | 'targetValue') => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === '') {
      handleChange(field, undefined);
      return;
    }
    const numValue = parseInt(rawValue, 10);
    if (!isNaN(numValue)) {
      handleChange(field, numValue);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isSaving && onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEditMode ? 'Edit Goal' : 'Create a New Goal'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 grid gap-4 py-4 overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} className="col-span-3" placeholder="e.g., Drink more water" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} className="col-span-3" placeholder="Why is this goal important?" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Type</Label>
            <RadioGroup value={formData.type} onValueChange={(v) => handleChange('type', v as GoalType)} className="col-span-3 flex gap-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value="frequency" id="r1" /><Label htmlFor="r1">Frequency</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="quantity" id="r2" /><Label htmlFor="r2">Quantity</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="value" id="r3" /><Label htmlFor="r3">Value</Label></div>
            </RadioGroup>
          </div>
          {formData.type === 'frequency' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right">Frequency</Label>
                <Select value={formData.frequency} onValueChange={(value) => handleChange('frequency', value as Goal['frequency'])}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.frequency === 'Weekly' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Days</Label>
                  <ToggleGroup type="multiple" variant="outline" value={formData.specificDays} onValueChange={(v) => handleChange('specificDays', v)} className="col-span-3 justify-start">
                    {weekDays.map(day => (<ToggleGroupItem key={day.value} value={day.value} aria-label={day.label}>{day.label}</ToggleGroupItem>))}
                  </ToggleGroup>
                </div>
              )}
            </>
          )}
          {formData.type === 'quantity' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target-quantity" className="text-right">Target</Label>
                <Input id="target-quantity" type="text" inputMode="numeric" value={formData.targetQuantity !== undefined ? new Intl.NumberFormat('en-US').format(formData.targetQuantity) : ''} onChange={(e) => handleNumericInputChange(e, 'targetQuantity')} className="col-span-3" placeholder="e.g., 300" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Period</Label>
                <Select value={formData.targetPeriod} onValueChange={(value) => handleChange('targetPeriod', value as GoalPeriod)}>
                  <SelectTrigger className="col-span-3"><SelectValue placeholder="Select period" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Per Week</SelectItem>
                    <SelectItem value="Monthly">Per Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          {formData.type === 'value' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="target-value" className="text-right">Target Value</Label>
                <Input id="target-value" type="text" inputMode="numeric" value={formData.targetValue !== undefined ? new Intl.NumberFormat('en-US').format(formData.targetValue) : ''} onChange={(e) => handleNumericInputChange(e, 'targetValue')} className="col-span-3" placeholder="e.g., 500" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">Unit</Label>
                <Input id="unit" value={formData.unit} onChange={(e) => handleChange('unit', e.target.value)} className="col-span-3" placeholder="e.g., USD, km, pages" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Period</Label>
                <Select value={formData.targetPeriod} onValueChange={(value) => handleChange('targetPeriod', value as GoalPeriod)}>
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
              <IconPicker value={formData.icon} onChange={(v) => handleChange('icon', v)} color={formData.color} />
              <ColorPicker color={formData.color} setColor={(v) => handleChange('color', v)} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Tags</Label>
            <div className="col-span-3">
              <TagInput
                allTags={allTags}
                selectedTags={formData.tags}
                onTagsChange={(v) => handleChange('tags', v)}
                onTagCreate={handleTagCreate}
                user={user}
                onTagsUpdated={fetchTags}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0 pt-4 border-t">
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