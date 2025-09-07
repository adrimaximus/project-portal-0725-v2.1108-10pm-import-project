import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Goal } from '@/types/goal';
import { Loader2 } from 'lucide-react';
import { Tag } from '@/types/tag';
import CreatableSelect from 'react-select/creatable';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
}

interface TagOption {
  value: string;
  label: string;
  color?: string;
  __isNew__?: boolean;
}

const fetchTags = async (): Promise<Tag[]> => {
  const { data, error } = await supabase.from('tags').select('*');
  if (error) throw new Error(error.message);
  return data;
};

const GoalFormModal = ({ isOpen, onClose, goal }: GoalFormModalProps) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#3b82f6');
  const [targetQuantity, setTargetQuantity] = useState<number | ''>(10);
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);

  const { data: availableTags } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description || '');
      setIcon(goal.icon || '🎯');
      setColor(goal.color || '#3b82f6');
      setTargetQuantity(goal.target_quantity || '');
      setSelectedTags(goal.tags?.map(t => ({ value: t.id, label: t.name, color: t.color })) || []);
    } else {
      setTitle('');
      setDescription('');
      setIcon('🎯');
      setColor('#3b82f6');
      setTargetQuantity(10);
      setSelectedTags([]);
    }
  }, [goal, isOpen]);

  const mutation = useMutation({
    mutationFn: async (formData: any) => {
      const rpcName = goal ? 'update_goal_with_tags' : 'create_goal_and_link_tags';
      
      const params = goal 
        ? {
            p_goal_id: goal.id,
            p_title: formData.p_title,
            p_description: formData.p_description,
            p_icon: formData.p_icon,
            p_color: formData.p_color,
            p_type: formData.p_type,
            p_target_quantity: formData.p_target_quantity,
            p_tags: formData.p_existing_tags,
            p_custom_tags: formData.p_custom_tags,
          }
        : {
            p_title: formData.p_title,
            p_description: formData.p_description,
            p_icon: formData.p_icon,
            p_color: formData.p_color,
            p_type: formData.p_type,
            p_target_quantity: formData.p_target_quantity,
            p_existing_tags: formData.p_existing_tags,
            p_custom_tags: formData.p_custom_tags,
          };

      const { data, error } = await supabase.rpc(rpcName, params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(goal ? "Goal updated successfully." : "Goal created successfully.");
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(goal ? "Failed to update goal." : "Failed to create goal.", { description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const existing_tags = selectedTags.filter(t => !t.__isNew__).map(t => t.value);
    const custom_tags = selectedTags.filter(t => t.__isNew__).map(t => ({ name: t.label, color: '#cccccc' }));

    const formData = {
      p_title: title,
      p_description: description,
      p_icon: icon,
      p_color: color,
      p_type: 'habit',
      p_target_quantity: targetQuantity === '' ? null : Number(targetQuantity),
      p_existing_tags: existing_tags,
      p_custom_tags: custom_tags,
    };

    mutation.mutate(formData);
  };

  const tagOptions: TagOption[] = availableTags?.map(tag => ({
    value: tag.id,
    label: tag.name,
    color: tag.color,
  })) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogDescription>
            {goal ? 'Update the details of your goal.' : 'Set up a new goal to track your progress.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">Icon</Label>
              <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} className="col-span-1" />
              <Label htmlFor="color" className="text-right col-start-3">Color</Label>
              <Input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="col-span-1" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target-quantity" className="text-right">Target</Label>
              <Input id="target-quantity" type="number" value={targetQuantity} onChange={(e) => setTargetQuantity(e.target.value === '' ? '' : Number(e.target.value))} className="col-span-3" placeholder="e.g., 10 books" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tags" className="text-right">Tags</Label>
              <div className="col-span-3">
                <CreatableSelect
                  isMulti
                  options={tagOptions}
                  value={selectedTags}
                  onChange={(newValue) => setSelectedTags(newValue as TagOption[])}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {goal ? 'Save Changes' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoalFormModal;