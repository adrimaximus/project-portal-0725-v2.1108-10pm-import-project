import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Project, PROJECT_STATUS_OPTIONS } from '@/types';
import AddressAutocompleteInput from '../AddressAutocompleteInput';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: string;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  onOpenChange,
  defaultStatus = 'Requested', // Default to 'Requested' if not provided
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: projectStatuses = [] } = useProjectStatuses();
  
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<Partial<Project>>({
    defaultValues: {
      name: '',
      description: '',
      status: defaultStatus,
      category: 'General',
      venue: '',
    }
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      // 1. Create Project
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: data.name!,
          description: data.description,
          status: data.status,
          category: data.category,
          venue: data.venue,
          created_by: user!.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // 2. Add creator as owner (handled by trigger now, but safe to keep/redundant)
      // The trigger `add_creator_to_project_members` handles this automatically on insert.
      
      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      toast.error('Failed to create project: ' + error.message);
    },
  });

  const onSubmit = (data: Partial<Project>) => {
    createProjectMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              {...register('name', { required: 'Project name is required' })}
              placeholder="Enter project name"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter project description"
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectStatuses.length > 0 ? (
                        projectStatuses.map(status => (
                          <SelectItem key={status.id} value={status.name}>
                            {status.name}
                          </SelectItem>
                        ))
                      ) : (
                        PROJECT_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Wedding">Wedding</SelectItem>
                      <SelectItem value="Corporate">Corporate</SelectItem>
                      <SelectItem value="Birthday">Birthday</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Venue</Label>
            <Controller
              name="venue"
              control={control}
              render={({ field }) => (
                <AddressAutocompleteInput
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Search for a venue..."
                />
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;