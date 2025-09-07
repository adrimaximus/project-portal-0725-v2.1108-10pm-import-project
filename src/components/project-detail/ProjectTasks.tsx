import { useState, useMemo } from 'react';
import { Task, Profile } from '@/types';
import { MultiSelect, Option } from '@/components/ui/multi-select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';

// Use intersection type to handle inconsistencies in the Task type
type DetailedTask = Task & { description?: string; assignedTo?: Profile[] };

interface ProjectTasksProps {
  tasks: DetailedTask[];
  projectId: string;
}

export default function ProjectTasks({ tasks, projectId }: ProjectTasksProps) {
  const queryClient = useQueryClient();

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

  const userOptions: Option[] = useMemo(() => {
    return (projectMembers || []).map(user => ({
      value: user.id,
      label: `${user.first_name} ${user.last_name}`.trim() || user.email || 'Unnamed User',
    }));
  }, [projectMembers]);

  const { mutate: assignUsers } = useMutation({
    mutationFn: async ({ taskId, userIds }: { taskId: string; userIds: string[] }) => {
      // Placeholder for mutation logic
      console.log('Assigning users', { taskId, userIds });
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      toast.success('Assignees updated.');
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: (error) => {
      toast.error(`Failed to update assignees: ${error.message}`);
    },
  });

  const onTaskAssignUsers = (taskId: string, userIds: string[]) => {
    assignUsers({ taskId, userIds });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <Button size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
      <div className="border rounded-md">
        {tasks.map(task => (
          <div key={task.id} className="p-4 border-b last:border-b-0 flex justify-between items-center">
            <div>
              <p className="font-medium">{task.title}</p>
              <p className="text-sm text-muted-foreground">{task.description}</p>
            </div>
            <div className="w-64">
              <MultiSelect
                  options={userOptions}
                  selected={userOptions.filter(option => (task.assignedTo || []).some(u => u.id === option.value))}
                  onChange={(selectedOptions) => {
                    onTaskAssignUsers(task.id, selectedOptions.map(option => option.value));
                  }}
                  placeholder="Assign..."
                />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}