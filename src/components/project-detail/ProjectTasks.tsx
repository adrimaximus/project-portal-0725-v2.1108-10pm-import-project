import { useState, useMemo } from "react";
import { Task, Project, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Flag, Calendar, User as UserIcon } from "lucide-react";
import TaskFormDialog from "./TaskFormDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { cn, getPriorityStyles, isOverdue } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MultiSelect } from "@/components/ui/multi-select";
import { generatePastelColor, getInitials } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectTasksProps {
  project: Project;
  teamMembers: User[];
}

const ProjectTasks = ({ project, teamMembers }: ProjectTasksProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const queryClient = useQueryClient();

  const { mutate: updateTaskCompletion } = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const { error } = await supabase.from('tasks').update({ completed }).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task updated");
      queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleAddNewTask = () => {
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const sortedTasks = useMemo(() => {
    return [...(project.tasks || [])].sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });
  }, [project.tasks]);

  const visibleTasks = showCompleted ? sortedTasks : sortedTasks.filter(t => !t.completed);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Tasks</CardTitle>
          <Button onClick={handleAddNewTask} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visibleTasks.map(task => {
            const priorityStyles = getPriorityStyles(task.priority);
            const overdue = isOverdue(task.due_date);
            const createdByFullName = task.created_by ? [task.created_by.first_name, task.created_by.last_name].filter(Boolean).join(' ') : '';

            return (
              <div key={task.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
                <Checkbox
                  className="mt-1"
                  checked={task.completed}
                  onCheckedChange={(checked) => updateTaskCompletion({ taskId: task.id, completed: !!checked })}
                />
                <div className="flex-1 cursor-pointer" onClick={() => handleEditTask(task)}>
                  <p className={cn("font-medium", { "line-through text-muted-foreground": task.completed })}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {task.due_date && (
                      <div className={cn("flex items-center gap-1", { "text-red-500": overdue && !task.completed })}>
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.due_date), "MMM d")}
                      </div>
                    )}
                    {task.priority && (
                      <div className="flex items-center gap-1">
                        <Flag className="h-3 w-3" style={{ color: priorityStyles.hex }} />
                        {task.priority}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {task.assignees?.map(user => {
                      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
                      return (
                        <TooltipProvider key={user.id}>
                          <Tooltip>
                            <TooltipTrigger>
                              <Avatar className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback style={generatePastelColor(user.id)}>{getInitials(fullName)}</AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>{fullName}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })}
                  </div>
                  {task.created_by && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={task.created_by.avatar_url} />
                            <AvatarFallback style={generatePastelColor(task.created_by.id)}>{getInitials(createdByFullName)}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>Created by {createdByFullName}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {sortedTasks.some(t => t.completed) && (
          <Button variant="link" size="sm" className="mt-2" onClick={() => setShowCompleted(!showCompleted)}>
            {showCompleted ? "Hide completed" : `Show ${sortedTasks.filter(t => t.completed).length} completed`}
          </Button>
        )}
      </CardContent>
      <TaskFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        project={project}
        teamMembers={teamMembers}
        task={editingTask}
      />
    </Card>
  );
};

export default ProjectTasks;