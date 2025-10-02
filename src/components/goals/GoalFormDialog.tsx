import { useState, useEffect, useCallback } from 'react';
import { Goal, GoalType, GoalPeriod, Tag, GOAL_TYPES, GOAL_PERIODS } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import IconPicker from './IconPicker';
import { Circle, Palette } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { MultiSelect } from '../ui/multi-select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FED766', '#2AB7CA', '#F0B8B8', '#C1E1C1', '#B2B2B2'];
const icons = ['🎯', '⭐', '💪', '🧘', '📚', '🏃', '💰', '❤️'];

interface GoalFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: any, isEdit: boolean) => void;
  goal?: Goal | null;
}

const GoalFormDialog = ({ isOpen, onClose, onSave, goal }: GoalFormDialogProps) => {
  const { user } = useAuth();
  const isEditMode = !!goal;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'habit' as GoalType,
    frequency: 'Daily',
    specificDays: [] as string[],
    targetQuantity: undefined as number | undefined,
    targetPeriod: 'month' as GoalPeriod,
    targetValue: undefined as number | undefined,
    unit: '',
    color: colors[0],
    icon: icons[0],
    tags: [] as Tag[],
  });
  const [allTags, setAllTags] = useState<Tag[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      if (!user) return;
      const { data, error } = await supabase.from('tags').select('*').eq('user_id', user.id);
      if (data) setAllTags(data);
    };
    fetchTags();
  }, [user]);

  useEffect(() => {
    if (isEditMode && goal) {
      setFormData({
        title: goal.title,
        description: goal.description || '',
        type: goal.type,
        frequency: goal.frequency || 'Daily',
        specificDays: goal.specific_days || [],
        targetQuantity: goal.target_quantity || undefined,
        targetPeriod: goal.target_period || 'month',
        targetValue: goal.target_value || undefined,
        unit: goal.unit || '',
        color: goal.color,
        icon: goal.icon,
        tags: goal.tags || [],
      });
    } else {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomIcon = icons[Math.floor(Math.random() * icons.length)];
      setFormData({
        title: '', description: '', type: 'habit', frequency: 'Daily',
        specificDays: [], targetQuantity: undefined, targetPeriod: 'month',
        targetValue: undefined, unit: '', color: randomColor, icon: randomIcon, tags: [],
      });
    }
  }, [goal, isEditMode]);

  const handleTagCreate = (tagName: string) => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newTag: Tag = { id: uuidv4(), name: tagName, color: randomColor, isNew: true };
    setAllTags(prev => [...prev, newTag]);
    setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && goal) {
        const newTags = formData.tags.filter(t => t.isNew);
        const existingTagIds = formData.tags.filter(t => !t.isNew).map(t => t.id);
        const { tags, ...restOfFormData } = formData;
        onSave({
            ...restOfFormData,
            p_goal_id: goal.id,
            p_custom_tags: newTags.map(({ name, color }) => ({ name, color })),
            p_tags: existingTagIds,
        }, true);
    } else {
        const { tags, ...restOfFormData } = formData;
        const existingTagIds = tags.filter(t => !t.isNew && t.id).map(t => t.id);
        const newCustomTags = tags.filter(t => t.isNew).map(({ name, color }) => ({ name, color }));
        onSave({
            ...restOfFormData,
            p_existing_tags: existingTagIds,
            p_custom_tags: newCustomTags,
        }, false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields... */}
          <Input
            placeholder="Goal Title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
          />
          <Textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
          <Select value={formData.type} onValueChange={(v) => handleChange('type', v as GoalType)}>
            <SelectTrigger><SelectValue placeholder="Goal Type" /></SelectTrigger>
            <SelectContent>
              {GOAL_TYPES.map(type => <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>

          {formData.type === 'habit' && (
            <Select value={formData.frequency} onValueChange={(v) => handleChange('frequency', v)}>
              <SelectTrigger><SelectValue placeholder="Frequency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          )}

          {formData.type === 'target' && (
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" placeholder="Target Quantity" value={formData.targetQuantity} onChange={e => handleChange('targetQuantity', parseInt(e.target.value))} />
              <Select value={formData.targetPeriod} onValueChange={(v) => handleChange('targetPeriod', v as GoalPeriod)}>
                <SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger>
                <SelectContent>
                  {GOAL_PERIODS.map(p => <SelectItem key={p} value={p}>Per {p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.type === 'limit' && (
             <div className="grid grid-cols-2 gap-4">
              <Input type="number" placeholder="Target Value" value={formData.targetValue} onChange={e => handleChange('targetValue', parseFloat(e.target.value))} />
              <Input placeholder="Unit (e.g., $, kg)" value={formData.unit} onChange={e => handleChange('unit', e.target.value)} />
            </div>
          )}

          <MultiSelect
            options={allTags.map(t => ({ value: t.id, label: t.name }))}
            selected={formData.tags.map(t => t.id)}
            onChange={(selectedIds) => {
              const selectedTags = allTags.filter(t => selectedIds.includes(t.id));
              handleChange('tags', selectedTags);
            }}
            onCreate={handleTagCreate}
            placeholder="Select or create tags..."
            className="w-full"
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Goal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoalFormDialog;