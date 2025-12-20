import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { Tag, CustomProperty } from '@/types';
import ColorPicker from '../goals/ColorPicker';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import CustomPropertyInput from './CustomPropertyInput';
import { MultiSelect } from '@/components/ui/multi-select';

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tag: Omit<Tag, 'id' | 'user_id'>) => void;
  tag: Partial<Tag> | null;
  isSaving: boolean;
  groups: string[];
}

const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color."),
  groups: z.array(z.string()).optional(),
  custom_properties: z.record(z.any()).optional(),
});

type TagFormValues = z.infer<typeof tagSchema>;

const TagFormDialog = ({ open, onOpenChange, onSave, tag, isSaving, groups }: TagFormDialogProps) => {
  const isEditMode = !!tag?.id;

  const { data: properties = [], isLoading: isLoadingProperties } = useQuery<CustomProperty[]>({
    queryKey: ['custom_properties', 'tag'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_properties').select('*').eq('category', 'tag');
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing tags to validate uniqueness
  const { data: existingTags = [] } = useQuery({
    queryKey: ['tags_validation'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('id, name');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
  });

  useEffect(() => {
    if (open) {
      if (tag) {
        form.reset({ 
          name: tag.name || '', 
          color: tag.color || '#6b7280', 
          groups: tag.groups || (tag.type ? [tag.type] : []), 
          custom_properties: tag.custom_properties || {} 
        });
      } else {
        form.reset({ name: '', color: '#6b7280', groups: [], custom_properties: {} });
      }
    }
  }, [tag, open, form]);

  const handleSubmit = (data: TagFormValues) => {
    const normalizedName = data.name.trim().toLowerCase();
    const isDuplicate = existingTags.some(t => 
      t.name.trim().toLowerCase() === normalizedName && 
      t.id !== tag?.id
    );

    if (isDuplicate) {
      form.setError('name', { type: 'manual', message: 'A tag with this name already exists.' });
      return;
    }

    onSave({
      ...data,
      groups: data.groups || [],
      // Backward compatibility if needed, take first group
      type: data.groups && data.groups.length > 0 ? data.groups[0] : null
    });
  };

  const groupOptions = groups.map(g => ({ value: g, label: g }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Tag' : 'Create New Tag'}</DialogTitle>
          <DialogDescription>
            Tags help you organize and categorize items like projects and goals.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Tag Name</FormLabel>
                <FormControl><Input {...field} placeholder="e.g., High Priority" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="groups" render={({ field }) => (
              <FormItem>
                <FormLabel>Groups</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={groupOptions}
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Select groups..."
                    creatable
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
            {isLoadingProperties ? (
              <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : properties.length > 0 && (
              <div className="space-y-4 border-t pt-4">
                {properties.map(prop => (
                  <FormField
                    key={prop.id}
                    control={form.control}
                    name={`custom_properties.${prop.name}`}
                    render={({ field }) => (
                      <FormItem>
                        <CustomPropertyInput
                          property={prop}
                          control={form.control}
                          name={`custom_properties.${prop.name}`}
                          bucket="tag-assets"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}
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