import { Task } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { generatePastelColor, getPriorityStyles, getTaskStatusStyles, isOverdue, cn, getAvatarUrl, getInitials } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Circle,
  Clock,
  MoreHorizontal,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import TaskFormDialog from "./TaskFormDialog";

interface TasksViewProps {
  tasks: Task[];
  isLoading: boolean;
}

const priorityIcons = {
  low: <ArrowDown className="h-4 w-4 text-gray-500" />,
  normal: <CheckCircle className="h-4 w-4 text-yellow-500" />,
  high: <ArrowUp className="h-4 w-4 text-red-500" />,
};

const statusIcons = {
  "To do": <Circle className="h-4 w-4 text-gray-500" />,
  "In progress": <Clock className="h-4 w-4 text-blue-500" />,
  Done: <CheckCircle className="h-4 w-4 text-green-500" />,
  Backlog: <AlertCircle className="h-4 w-4 text-purple-500" />,
};

export function TasksView({ tasks, isLoading }: TasksViewProps) {
  const queryClient = useQueryClient();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      toast.error(`Error deleting task: ${error.message}`);
    },
  });

  const handleEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleDelete = (taskId: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="w-24">
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="w-24">
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="w-24">
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex -space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[20px]"></TableHead>
            <TableHead>Task</TableHead>
            <TableHead className="w-[150px]">Project</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[120px]">Due Date</TableHead>
            <TableHead className="w-[100px]">Priority</TableHead>
            <TableHead className="w-[150px]">Assignees</TableHead>
            <TableHead className="w-[50px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger>
                    {statusIcons[task.status as keyof typeof statusIcons] || <Circle className="h-4 w-4 text-gray-500" />}
                  </TooltipTrigger>
                  <TooltipContent>{task.status}</TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>
                <Link
                  to={`/projects/${task.project_slug}`}
                  className="hover:underline"
                >
                  {task.project_name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "border",
                    getTaskStatusStyles(task.status).tw
                  )}
                >
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell
                className={cn(
                  "text-sm",
                  isOverdue(task.due_date) && "text-red-500"
                )}
              >
                {task.due_date
                  ? format(new Date(task.due_date), "MMM d, yyyy")
                  : "No due date"}
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-2">
                    {priorityIcons[task.priority as keyof typeof priorityIcons] || null}
                    <span className="capitalize">{task.priority}</span>
                  </TooltipTrigger>
                  <TooltipContent>{task.priority} priority</TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>
                <div className="flex items-center -space-x-2">
                  {task.assignees.map((user) => (
                    <Tooltip key={user.id}>
                      <TooltipTrigger>
                        <Avatar className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={getAvatarUrl(user.avatar_url) || undefined} />
                          <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>
                            {getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>{[user.first_name, user.last_name].filter(Boolean).join(' ')}</TooltipContent>
                    </Tooltip>
                  ))}
                  {task.created_by && !task.assignees.some(a => a.id === task.created_by.id) && (
                     <Tooltip>
                      <TooltipTrigger>
                        <Avatar key={task.created_by.id} className="h-8 w-8 border-2 border-background opacity-50">
                          <AvatarImage src={getAvatarUrl(task.created_by.avatar_url) || undefined} />
                          <AvatarFallback style={{ backgroundColor: generatePastelColor(task.created_by.id) }}>
                            {getInitials([task.created_by.first_name, task.created_by.last_name].filter(Boolean).join(' '), task.created_by.email || undefined)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>Created by {[task.created_by.first_name, task.created_by.last_name].filter(Boolean).join(' ')}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleEdit(task)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => handleDelete(task.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editingTask && (
        <TaskFormDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          task={editingTask}
          onSubmit={() => {}}
          isSubmitting={false}
        />
      )}
    </TooltipProvider>
  );
}