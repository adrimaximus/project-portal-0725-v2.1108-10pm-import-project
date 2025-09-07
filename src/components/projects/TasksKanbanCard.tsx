import { Task, TaskAssignee } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { generatePastelColor, getPriorityStyles, isOverdue, cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle, Ticket, MoreHorizontal, Edit, Trash2, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import TaskAttachmentList from './TaskAttachmentList';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { TaskAttachment } from '@/types/task';

interface TasksKanbanCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const getInitials = (user: TaskAssignee) => {
    const firstNameInitial = user.first_name?.[0] || '';
    const lastNameInitial = user.last_name?.[0] || '';
    if (firstNameInitial && lastNameInitial) {
        return `${firstNameInitial}${lastNameInitial}`.toUpperCase();
    }
    return (user.email?.[0] || 'U').toUpperCase();
}

const TasksKanbanCard = ({ task, onEdit, onDelete }: TasksKanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityStyle = getPriorityStyles(task.priority);

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderAttachments = () => {
    const allAttachments: TaskAttachment[] = [...(task.attachments || [])];

    if (task.originTicketId && task.attachment_url) {
      if (!allAttachments.some(att => att.file_url === task.attachment_url)) {
        allAttachments.unshift({
          id: `origin-${task.originTicketId}`,
          file_name: task.attachment_name || 'Ticket Attachment',
          file_url: task.attachment_url,
          file_type: '',
          file_size: 0,
          storage_path: '',
          created_at: task.created_at,
        });
      }
    }

    if (allAttachments.length === 0) return null;

    return (
      <Dialog>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1 text-muted-foreground cursor-pointer hover:text-primary">
                  <Paperclip className="h-3 w-3" />
                  <span className="text-xs">{allAttachments.length}</span>
                </div>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent><p>{allAttachments.length} attachment(s)</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent>
          <TaskAttachmentList attachments={allAttachments} />
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="mb-4 bg-card border-l-4 cursor-grab active:cursor-grabbing"
      // @ts-ignore
      style={{ ...style, borderLeftColor: priorityStyle.hex }}
    >
      <CardHeader className="p-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium leading-snug flex items-center gap-1.5 pr-2">
            {task.status === 'Done' && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
            {task.originTicketId && <Ticket className={cn("h-4 w-4 flex-shrink-0", task.status === 'Done' ? 'text-green-500' : 'text-red-500')} />}
            <span>{task.title}</span>
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={handleDropdownClick}>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={handleDropdownClick}>
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
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="space-y-2">
          {task.projects && task.projects.name !== 'General Tasks' && (
            <div className="text-xs text-muted-foreground">
              <Link to={`/projects/${task.projects.slug}`} className="hover:underline text-primary truncate max-w-[120px]">
                {task.projects.name}
              </Link>
            </div>
          )}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2" title={task.description}>
              {task.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center -space-x-2">
            {(task.assignees && task.assignees.length > 0)
              ? task.assignees.map((user) => (
                <TooltipProvider key={user.id}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback style={generatePastelColor(user.id)}>
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
              : <div className="h-6 w-6" />
            }
          </div>
          <div className="flex items-center gap-2">
            {renderAttachments()}
            {task.due_date && (
              <div className={cn("text-xs text-muted-foreground", isOverdue(task.due_date) && "text-red-600 font-bold")}>
                due {format(new Date(task.due_date), "MMM d")}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TasksKanbanCard;