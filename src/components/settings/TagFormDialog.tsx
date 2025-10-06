import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { Tag } from '@/types';
import ColorPicker from '../goals/ColorPicker';
import { GroupSelect } from './GroupSelect';

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tag: Omit<Tag, 'id' | 'user_id'>) => void;
  tag: Tag | null;
  isSaving: boolean;
  groups: string[];
  initialGroup?: string | null;
}

const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color."),
  type: z.string().optional(),
});

type TagFormValues = z.infer<typeof tagSchema>;

const TagFormDialog = ({ open, onOpenChange, onSave, tag, isSaving, groups, initialGroup }: TagFormDialogProps) => {
  const isEditMode = !!tag;

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
  });

  useEffect(() => {
    if (open) {
      if (tag) {
        form.reset({ name: tag.name, color: tag.color, type: tag.type || 'general' });
      } else {
        form.reset({ name: '', color: '#6b7280', type: initialGroup || 'general' });
      }
    }
  }, [tag, open, form, initialGroup]);

  const title = isEditMode ? 'Edit Tag' : (initialGroup ? `Create First Tag for "${initialGroup}"` : 'Create New Tag');
  const description = isEditMode 
    ? "Tags help you organize and categorize items like projects and goals."
    : (initialGroup 
        ? "Now, create the first tag to officially create your new group."
        : "Tags help you organize and categorize items like projects and goals.");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave as any)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Tag Name</FormLabel>
                <FormControl><Input {...field} placeholder="e.g., High Priority" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Group</FormLabel>
                <FormControl>
                  <GroupSelect 
                    value={field.value || 'general'} 
                    onChange={field.onChange} 
                    groups={groups} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="color" render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl><ColorPicker color={field.value} setColor={field.onChange} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Tag
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TagFormDialog;