import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateProject } from '@/hooks/useCreateProject';
import { Project } from '@/types';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onSuccess: (project: Project) => void;
}

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required."),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const CreateProjectDialog = ({ open, onOpenChange, initialName = '', onSuccess }: CreateProjectDialogProps) => {
  const createProjectMutation = useCreateProject();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: initialName,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ name: initialName });
    }
  }, [open, initialName, form]);

  const onSubmit = (values: ProjectFormValues) => {
    createProjectMutation.mutate({
      name: values.name,
      category: 'General',
    }, {
      onSuccess: (newProject) => {
        toast.success(`Project "${newProject.name}" created successfully.`);
        onSuccess(newProject);
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error("Failed to create project.", { description: error.message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Enter a name for the new project.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="create-project-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Q3 Marketing Campaign" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="create-project-form" disabled={createProjectMutation.isPending}>
            {createProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;