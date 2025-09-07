import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Person, Tag, Project } from '@/types';
import React from 'react';

const personFormSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email().optional().or(z.literal('')),
  company: z.string().optional(),
  job_title: z.string().optional(),
  tag_ids: z.array(z.string()).optional(),
  project_ids: z.array(z.string()).optional(),
});

type PersonFormValues = z.infer<typeof personFormSchema>;

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Person | null;
}

export default function PersonFormDialog({ open, onOpenChange, person }: PersonFormDialogProps) {
  const queryClient = useQueryClient();
  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
      company: '',
      job_title: '',
      tag_ids: [],
      project_ids: [],
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        full_name: person?.full_name || '',
        email: person?.contact?.emails?.[0] || '',
        company: person?.company || '',
        job_title: person?.job_title || '',
        tag_ids: person?.tags?.map(t => t.id) || [],
        project_ids: person?.projects?.map(p => p.id) || [],
      });
    }
  }, [person, open, form]);

  const { data: allTags = [] } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: allProjects = [] } = useQuery<Pick<Project, 'id' | 'name'>[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('id, name');
      if (error) throw error;
      return data;
    },
  });

  const { mutate: upsertPerson, isPending } = useMutation({
    mutationFn: async (values: PersonFormValues) => {
      // Placeholder for mutation logic
      console.log('Upserting person', { ...values, id: person?.id });
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast.success(person ? 'Person updated' : 'Person created');
      queryClient.invalidateQueries({ queryKey: ['people'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to save person: ${error.message}`);
    },
  });

  const onSubmit = (values: PersonFormValues) => {
    upsertPerson(values);
  };

  const tagOptions = allTags.map(t => ({ value: t.id, label: t.name }));
  const projectOptions = allProjects.map(p => ({ value: p.id, label: p.name }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{person ? 'Edit Person' : 'Add New Person'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tag_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={tagOptions}
                      selected={tagOptions.filter(option => (field.value || []).includes(option.value))}
                      onChange={(selectedOptions) => field.onChange(selectedOptions.map(option => option.value))}
                      placeholder="Select tags..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="project_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projects</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={projectOptions}
                      selected={projectOptions.filter(option => (field.value || []).includes(option.value))}
                      onChange={(selectedOptions) => field.onChange(selectedOptions.map(option => option.value))}
                      placeholder="Link projects..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}