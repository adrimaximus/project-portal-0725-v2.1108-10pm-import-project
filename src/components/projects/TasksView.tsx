import { useState } from "react";
import { Task, Project, TaskAssignee } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { generatePastelColor, getPriorityStyles, getStatusStyles, isOverdue, cn, getAvatarUrl, getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "../ui/badge";
import { Flag, Calendar } from "lucide-react";

interface TasksViewProps {
  tasks: Task[];
  projects: Project[];
  isLoading: boolean;
}

const TaskItem = ({ task, project }: { task: Task; project?: Project }) => {
  const queryClient = useQueryClient();

  const { mutate: updateTask, isPending: isUpdating } = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task status updated.");
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project', project?.slug] });
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const handleCheckedChange = (checked: boolean) => {
    updateTask({ taskId: task.id, completed: checked });
  };

  const priorityStyles = getPriorityStyles(task.priority);
  const statusStyles = getStatusStyles(task.status);
  const overdue = isOverdue(task.due_date);

  const getAssigneeName = (assignee: TaskAssignee) => {
    return [assignee.first_name, assignee.last_name].filter(Boolean).join(' ');
  }

  return (
    <div className="flex items-start gap-4 p-3 hover:bg-muted/50 rounded-lg">
      <Checkbox
        checked={task.completed}
        onCheckedChange={handleCheckedChange}
        className="mt-1"
        disabled={isUpdating}
      />
      <div className="flex-1">
        <p className={cn("font-medium", { "line-through text-muted-foreground": task.completed })}>
          {task.title}
        </p>
        <div className="text-xs text-muted-foreground flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
          {project && (
            <Link to={`/projects/${project.slug}`} className="hover:underline">
              {project.name}
            </Link>
          )}
          {task.due_date && (
            <div className={cn("flex items-center gap-1", { "text-red-500": overdue && !task.completed })}>
              <Calendar className="h-3 w-3" />
              {format(new Date(task.due_date), "MMM d")}
            </div>
          )}
          {task.priority && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <Flag className="h-3 w-3" style={{ color: priorityStyles.hex }} />
                    <span>{task.priority}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Priority: {task.priority}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {task.status && (
             <Badge variant="outline" className={cn("border-transparent", statusStyles.className)}>
                {task.status}
              </Badge>
          )}
        </div>
      </div>
      <div className="flex -space-x-2">
        {task.assignees?.map((assignee) => (
          <TooltipProvider key={assignee.id}>
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={getAvatarUrl(assignee)} />
                  <AvatarFallback style={generatePastelColor(assignee.id)}>
                    {getInitials(getAssigneeName(assignee))}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getAssigneeName(assignee)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

const TasksView = ({ tasks, projects, isLoading }: TasksViewProps) => {
  const [showCompleted, setShowCompleted] = useState(true);

  const { completedTasks, incompleteTasks } = tasks.reduce(
    (acc, task) => {
      if (task.completed) {
        acc.completedTasks.push(task);
      } else {
        acc.incompleteTasks.push(task);
      }
      return acc;
    },
    { completedTasks: [] as Task[], incompleteTasks: [] as Task[] }
  );

  const findProjectForTask = (taskId: string) => {
    return projects.find(p => p.tasks?.some(t => t.id === taskId));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>All Tasks</CardTitle>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
            />
            <label
              htmlFor="show-completed"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Completed
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {incompleteTasks.map((task) => (
            <TaskItem key={task.id} task={task} project={findProjectForTask(task.id)} />
          ))}
        </div>
        {showCompleted && completedTasks.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-muted-foreground mt-6 mb-2 px-3">Completed</h3>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} project={findProjectForTask(task.id)} />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TasksView;