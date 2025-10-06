import { useState, useEffect, useCallback } from 'react';
import { Goal, GoalType, GoalPeriod, Tag } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Loader2 } from 'lucide-react';
import IconPicker from './IconPicker';
import ColorPicker from './ColorPicker';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import TagsMultiselect from '../TagsMultiselect';
import { iconOptions } from '@/data/icons';

const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'];

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
}

const GoalFormDialog = ({ open, onOpenChange, goal }: GoalFormDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditMode = !!goal;
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      if (!user) return;
      const { data, error } = await supabase.from('tags').select('*').eq('user_id', user.id);
      if (data) setAllTags(data);
    };
    fetchTags();
  }, [user]);

  const resetForm = useCallback(() => {
    if (isEditMode && goal) {
      setFormData({
        title: goal.title,
        description: goal.description || '',
        type: goal.type,
        frequency: goal.frequency,
        specificDays: goal.specific_days || [],
        targetQuantity: goal.target_quantity,
        targetPeriod: goal.target_period || 'month',
        targetValue: goal.target_value,
        unit: goal.unit || '',
        color: goal.color,
        icon: goal.icon,
        tags: goal.tags || [],
      });
    } else {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomIcon = iconOptions[Math.floor(Math.random() * iconOptions.length)].value;
      setFormData({
        title: '',
        description: '',
        type: 'habit',
        frequency: 'Daily',
        specificDays: [],
        targetQuantity: undefined,
        targetPeriod: 'month',
        targetValue: undefined,
        unit: '',
        color: randomColor,
        icon: randomIcon,
        tags: [],
      });
    }
  }, [goal, isEditMode]);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleCreateTag = (tagName: string): Tag => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newTag: Tag = { id: uuidv4(), name: tagName, color: randomColor, isNew: true };
    setAllTags(prev => [...prev, newTag]);
    return newTag;
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    try {
      if (isEditMode && goal) {
        const newTags = formData.tags.filter((t: Tag) => t.isNew);
        const existingTagIds = formData.tags.filter((t: Tag) => !t.isNew).map((t: Tag) => t.id);
        const { tags, ...restOfFormData } = formData;

        const { error } = await supabase.rpc('update_goal_with_tags', {
          p_goal_id: goal.id,
          p_title: restOfFormData.title,
          p_description: restOfFormData.description,
          p_icon: restOfFormData.icon,
          p_color: restOfFormData.color,
          p_type: restOfFormData.type,
          p_target_quantity: restOfFormData.targetQuantity,
          p_target_value: restOfFormData.targetValue,
          p_frequency: restOfFormData.frequency,
          p_target_period: restOfFormData.targetPeriod,
          p_unit: restOfFormData.unit,
          p_specific_days: restOfFormData.specificDays,
          p_tags: existingTagIds,
          p_custom_tags: newTags.map(({ name, color }: Tag) => ({ name, color })),
        });
        if (error) throw error;
        toast.success('Goal updated successfully!');
      } else {
        const { tags, ...restOfFormData } = formData;
        const existingTagIds = tags.filter((t: Tag) => !t.isNew && t.id).map((t: Tag) => t.id);
        const newCustomTags = tags.filter((t: Tag) => t.isNew).map(({ name, color }: Tag) => ({ name, color }));

        const { error } = await supabase.rpc('create_goal_and_link_tags', {
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
          p_existing_tags: existingTagIds,
          p_custom_tags: newCustomTags,
        });
        if (error) throw error;
        toast.success('Goal created successfully!');
      }
      queryClient.invalidateQueries({ queryKey: ['goals', user.id] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogDescription>Set up your new goal and start tracking your progress.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
          <div className="flex items-center gap-4">
            <IconPicker value={formData.icon} onChange={(v) => handleChange('icon', v)} />
            <Input placeholder="Goal Title (e.g., Read 12 books)" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} required className="text-lg font-semibold" />
          </div>
          <Textarea placeholder="Description (optional)" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
          
          <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
            <SelectTrigger><SelectValue placeholder="Goal Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="habit">Habit (Frequency-based)</SelectItem>
              <SelectItem value="target">Target (Quantity or Value)</SelectItem>
            </SelectContent>
          </Select>

          {formData.type === 'habit' && (
            <>
              <Select value={formData.frequency} onValueChange={(v) => handleChange('frequency', v)}>
                <SelectTrigger><SelectValue placeholder="Frequency" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Specific days">Specific days of the week</SelectItem>
                  <SelectItem value="X times per week">X times per week</SelectItem>
                </SelectContent>
              </Select>
              {formData.frequency === 'Specific days' && (
                <ToggleGroup type="multiple" value={formData.specificDays} onValueChange={(v) => handleChange('specificDays', v)} className="flex-wrap justify-start">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <ToggleGroupItem key={day} value={day}>{day}</ToggleGroupItem>)}
                </ToggleGroup>
              )}
              {formData.frequency === 'X times per week' && (
                <Input type="number" placeholder="Times per week" value={formData.targetQuantity || ''} onChange={(e) => handleChange('targetQuantity', parseInt(e.target.value))} />
              )}
            </>
          )}

          {formData.type === 'target' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input type="number" placeholder="Target Quantity" value={formData.targetQuantity || ''} onChange={(e) => handleChange('targetQuantity', parseInt(e.target.value))} />
                <Input placeholder="Unit (e.g., books, km)" value={formData.unit} onChange={(e) => handleChange('unit', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input type="number" placeholder="Target Value" value={formData.targetValue || ''} onChange={(e) => handleChange('targetValue', parseFloat(e.target.value))} />
                <Select value={formData.targetPeriod} onValueChange={(v) => handleChange('targetPeriod', v)}>
                  <SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium">Tags</label>
            <TagsMultiselect
              options={allTags}
              value={formData.tags}
              onChange={(tags) => handleChange('tags', tags)}
              onTagCreate={handleCreateTag}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Color</label>
            <ColorPicker color={formData.color} setColor={(c) => handleChange('color', c)} />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Save Changes' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoalFormDialog;