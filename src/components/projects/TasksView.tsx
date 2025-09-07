import { Task, TaskAssignee } from "@/types/task";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { generateVibrantGradient, getPriorityStyles, getTaskStatusStyles, isOverdue, cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2, Ticket, Paperclip } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import TaskAttachmentList from './TaskAttachmentList';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface TasksViewProps {
  tasks: Task[];
  isLoading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleTaskCompletion: (task: Task, completed: boolean) => void;
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

const TasksView = ({ tasks, isLoading, onEdit, onDelete, onToggleTaskCompletion, sortConfig, requestSort }: TasksViewProps) => {
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

  const renderAttachments = (task: Task) => {
    const attachments = task.attachments || [];
    if (attachments.length === 0) return null;

    if (attachments.length === 1) {
      const file = attachments[0];
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href={file.file_url} download={file.file_name} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-block">
                <Paperclip className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </a>
            </TooltipTrigger>
            <TooltipContent><p>{file.file_name}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Dialog>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1 text-muted-foreground cursor-pointer hover:text-primary">
                  <Paperclip className="h-4 w-4" />
                  <span className="text-xs">{attachments.length}</span>
                </div>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent><p>{attachments.length} attachment(s)</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent>
          <TaskAttachmentList attachments={attachments} />
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%] sm:w-[30%] cursor-pointer hover:bg-muted/50 sticky left-0 bg-background z-10" onClick={() => requestSort('title')}>
              Task
            </TableHead>
            <TableHead className="w-[20%]">Project</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('status')}>
              Status
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('priority')}>
              Priority
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('due_date')}>
              Due Date
            </TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => requestSort('created_at')}>
              Created
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
              <TableRow key={task.id} data-state={task.completed ? "completed" : ""}>
                <TableCell className="font-medium sticky left-0 bg-background z-10 w-[40%] sm:w-[30%]">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onCheckedChange={(checked) => onToggleTaskCompletion(task, !!checked)}
                      aria-label={`Mark task ${task.title} as complete`}
                      className="mt-1"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {task.originTicketId && <Ticket className={`h-4 w-4 flex-shrink-0 ${task.completed ? 'text-green-500' : 'text-red-500'}`} />}
                        <span className={`font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                        {task.originTicketId && task.attachment_url && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a href={task.attachment_url} download={task.attachment_name} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-block">
                                  <Paperclip className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{task.attachment_name || 'View Attachment'}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {renderAttachments(task)}
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground mt-1 truncate">{task.description}</p>}
                      <div className="flex gap-1 flex-wrap mt-2">
                        {task.tags?.map(tag => (
                          <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>{tag.name}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="w-[20%]">
                  {task.projects && task.projects.name !== 'General Tasks' ? (
                    <Link to={`/projects/${task.projects.slug}`} className="hover:underline text-primary text-xs">
                      {task.projects.name}
                    </Link>
                  ) : null}
                </TableCell>
                <TableCell>
                  <span className={statusStyle.tw}>{task.status}</span>
                </TableCell>
                <TableCell>
                  <Badge className={priorityStyle.tw}>{task.priority || 'Low'}</Badge>
                </TableCell>
                <TableCell>
                  {task.due_date ? (
                    <span className={cn(isOverdue(task.due_date) && "text-red-600 font-bold")}>
                      {format(new Date(task.due_date), "MMM d, yyyy")}
                    </span>
                  ) : <span className="text-muted-foreground text-xs">No due date</span>}
                </TableCell>
                <TableCell>
                  {task.created_at ? (
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(task.created_at), "MMM d, yyyy")}
                    </span>
                  ) : <span className="text-muted-foreground text-xs">-</span>}
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