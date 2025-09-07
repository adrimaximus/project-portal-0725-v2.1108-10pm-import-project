"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelect, Option } from '@/components/ui/multi-select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Task, Profile } from '@/types';
import React from 'react';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// Use intersection type to handle inconsistencies in the Task type
type DetailedTask = Task & { description?: string; assignedTo?: Profile[] };

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: DetailedTask | null;
  projectId: string;
}

export default function TaskFormDialog({ open, onOpenChange, task, projectId }: TaskFormDialogProps) {
  const queryClient = useQueryClient();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      assigneeIds: task?.assignedTo?.map(u => u.id) || [],
    },
  });

  React.useEffect(() => {
    form.reset({
      title: task?.title || '',
      description: task?.description || '',
      assigneeIds: task?.assignedTo?.map(u => u.id) || [],
    });
  }, [task, form, open]);

  const { data: projectMembers } = useQuery({
    queryKey: ['projectMembers', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('user_id, profiles(*)')
        .eq('project_id', projectId);
      if (error) throw error;
      return data.map(m => m.profiles as Profile).filter(Boolean);
    },
    enabled: !!projectId,
  });

  const userOptions: Option[] = React.useMemo(() => {
    return (projectMembers || []).map(user => ({
      value: user.id,
      label: `${user.first_name} ${user.last_name}`.trim() || user.email || 'Unnamed User',
    }));
  }, [projectMembers]);

  const { mutate: upsertTask, isPending: isSubmitting } = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      // This is a placeholder for the actual mutation logic
      console.log('Upserting task:', { ...values, id: task?.id, projectId });
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast.success(task ? 'Task updated' : 'Task created');
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to ${task ? 'update' : 'create'} task: ${error.message}`);
    },
  });

  const onSubmit = (values: TaskFormValues) => {
    upsertTask(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update the details of your task.' : 'Add a new task to your project.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Design new landing page" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add more details about the task..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assigneeIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignees</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={userOptions}
                      selected={userOptions.filter(option => (field.value || []).includes(option.value))}
                      onChange={(selectedOptions) => field.onChange(selectedOptions.map(option => option.value))}
                      placeholder="Assign to..."
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}