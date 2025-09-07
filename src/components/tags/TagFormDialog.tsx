import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tag } from '@/types';
import { Loader2 } from 'lucide-react';

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Partial<Tag> | null;
}

const tagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color"),
  type: z.enum(['kanban', 'general']),
});

type TagFormValues = z.infer<typeof tagSchema>;

const TagFormDialog = ({ open, onOpenChange, tag }: TagFormDialogProps) => {
  const queryClient = useQueryClient();
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: '',
      color: '#cccccc',
      type: 'general',
    },
  });

  useEffect(() => {
    if (tag) {
      form.reset({
        name: tag.name || '',
        color: tag.color || '#cccccc',
        type: tag.type || 'general',
      });
    } else {
      form.reset({
        name: '',
        color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
        type: 'general',
      });
    }
  }, [tag, form, open]);

  const upsertTagMutation = useMutation({
    mutationFn: async (values: TagFormValues) => {
      const { data, error } = await supabase
        .from('tags')
        .upsert({
          id: tag?.id,
          name: values.name,
          color: values.color,
          type: values.type,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(`Tag ${tag?.id ? 'updated' : 'created'} successfully.`);
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to save tag: ${error.message}`);
    },
  });

  const onSubmit = (values: TagFormValues) => {
    upsertTagMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tag?.id ? 'Edit Tag' : 'Create New Tag'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="color" {...field} className="w-12 h-10 p-1" />
                      <Input type="text" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">General Label</SelectItem>
                      <SelectItem value="kanban">Kanban Column</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={upsertTagMutation.isPending}>
                {upsertTagMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TagFormDialog;