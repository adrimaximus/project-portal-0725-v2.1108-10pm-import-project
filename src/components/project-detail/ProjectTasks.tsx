import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task } from "@/types";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Circle,
  CheckCircle,
  MoreHorizontal,
  Trash2,
  Edit,
} from "lucide-react";
import TaskFormDialog from "@/components/projects/TaskFormDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MultiSelect } from "@/components/ui/multi-select";
import { generatePastelColor, getInitials } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ProjectTasks = ({ projectId }: { projectId: string }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_project_tasks', { p_project_ids: [projectId] });
      if (error) throw error;
      return data;
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      completed,
    }: {
      taskId: string;
      completed: boolean;
    }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ completed })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (error) => {
      toast.error(`Error deleting task: ${error.message}`);
    },
  });

  const handleToggle = (task: Task) => {
    updateTaskMutation.mutate({ taskId: task.id, completed: !task.completed });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDelete = (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tasks</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingTask(null);
            setIsDialogOpen(true);
          }}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {isLoading ? (
        <p>Loading tasks...</p>
      ) : (
        <div className="space-y-2">
          {tasks?.map((task) => {
            const createdByFullName = `${task.created_by.first_name || ''} ${task.created_by.last_name || ''}`.trim();
            return (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <button onClick={() => handleToggle(task)}>
                    {task.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <span
                    className={`flex-1 ${
                      task.completed ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <TooltipProvider>
                    <div className="flex items-center -space-x-2">
                      {task.assignees.map(user => {
                        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                        return (
                          <Tooltip key={user.id}>
                            <TooltipTrigger>
                              <Avatar className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>{getInitials(fullName, user.email)}</AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>{fullName || user.email}</TooltipContent>
                          </Tooltip>
                        )
                      })}
                       {task.created_by && !task.assignees.some(a => a.id === task.created_by.id) && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Avatar className="h-8 w-8 border-2 border-background opacity-50">
                              <AvatarImage src={task.created_by.avatar_url} />
                              <AvatarFallback style={{ backgroundColor: generatePastelColor(task.created_by.id) }}>{getInitials(createdByFullName, task.created_by.email)}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>Created by {createdByFullName || task.created_by.email}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEdit(task)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TaskFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        task={editingTask}
        onSubmit={() => {}}
        isSubmitting={false}
      />
    </div>
  );
};

export default ProjectTasks;