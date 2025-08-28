import { Task, TaskAssignee } from "@/types/task";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { generateVibrantGradient, getPriorityStyles, getTaskStatusStyles } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TasksViewProps {
  tasks: Task[];
  isLoading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  requestSort: (key: string) => void;
}

const getInitials = (user: TaskAssignee) => {
    const firstNameInitial = user.first_name?.[0] || '';
    const lastNameInitial = user.last_name?.[0] || '';
    if (firstNameInitial && lastNameInitial) {
        return `${firstNameInitial}${lastNameInitial}`.toUpperCase();
    }
    return (user.email?.[0] || 'U').toUpperCase();
}

const TasksView = ({ tasks, isLoading, onEdit, onDelete, sortConfig, requestSort }: TasksViewProps) => {
  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No tasks found.</div>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%] cursor-pointer hover:bg-muted/50 sticky left-0 bg-background z-10" onClick={() => requestSort('title')}>
              Task
            </TableHead>
            <TableHead>Project</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('status')}>
              Status
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('priority')}>
              Priority
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('due_date')}>
              Due Date
            </TableHead>
            <TableHead>Assignees</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => {
            const statusStyle = getTaskStatusStyles(task.status);
            const priorityStyle = getPriorityStyles(task.priority);
            return (
              <TableRow key={task.id}>
                <TableCell className="font-medium sticky left-0 bg-background z-10">
                  <div className="flex flex-col">
                    <span className="font-semibold">{task.title}</span>
                    {task.description && <p className="text-xs text-muted-foreground mt-1 truncate">{task.description}</p>}
                    <div className="flex gap-1 flex-wrap mt-2">
                      {task.tags?.map(tag => (
                        <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>{tag.name}</Badge>
                      ))}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {task.projects ? (
                    <Link to={`/projects/${task.projects.slug}`} className="hover:underline text-primary text-xs">
                      {task.projects.name}
                    </Link>
                  ) : 'N/A'}
                </TableCell>
                <TableCell>
                  <span className={statusStyle.tw}>{task.status}</span>
                </TableCell>
                <TableCell>
                  <Badge className={priorityStyle.tw}>{task.priority || 'Low'}</Badge>
                </TableCell>
                <TableCell>
                  {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : <span className="text-muted-foreground text-xs">No due date</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center -space-x-2">
                    {(task.assignees && task.assignees.length > 0)
                      ? task.assignees.map((user) => (
                        <TooltipProvider key={user.id}>
                          <Tooltip>
                            <TooltipTrigger>
                              <Avatar className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback style={generateVibrantGradient(user.id)}>
                                  {getInitials(user)}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{[user.first_name, user.last_name].filter(Boolean).join(' ')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))
                      : task.created_by && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Avatar key={task.created_by.id} className="h-8 w-8 border-2 border-background opacity-50">
                                <AvatarImage src={task.created_by.avatar_url || undefined} />
                                <AvatarFallback style={generateVibrantGradient(task.created_by.id)}>
                                  {getInitials(task.created_by)}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Created by {[task.created_by.first_name, task.created_by.last_name].filter(Boolean).join(' ')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    }
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(task)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => onDelete(task.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TasksView;