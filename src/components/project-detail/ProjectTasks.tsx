import { Task } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ListChecks } from "lucide-react";

interface ProjectTasksProps {
  tasks: Task[];
  projectId: string;
}

const ProjectTasks = ({ tasks, projectId }: ProjectTasksProps) => {
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed, status: completed ? 'Done' : 'To do' })
        .eq('id', taskId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      // The real-time subscription will handle invalidation,
      // but we can show a toast here for immediate feedback.
      toast.success("Task status updated.");
    },
    onError: (error) => {
      toast.error("Failed to update task.", { description: error.message });
    },
  });

  const handleTaskCompletion = (taskId: string, completed: boolean) => {
    updateTaskMutation.mutate({ taskId, completed });
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <ListChecks className="mx-auto h-12 w-12" />
        <p className="mt-4">No tasks for this project yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted">
          <Checkbox
            id={`task-${task.id}`}
            checked={task.completed}
            onCheckedChange={(checked) => handleTaskCompletion(task.id, !!checked)}
          />
          <label
            htmlFor={`task-${task.id}`}
            className={`flex-1 text-sm ${task.completed ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}
          >
            {task.title}
          </label>
        </div>
      ))}
    </div>
  );
};

export default ProjectTasks;