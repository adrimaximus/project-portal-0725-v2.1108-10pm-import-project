import { Task, TaskAttachment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { generatePastelColor, getPriorityStyles, isOverdue, cn, getAvatarUrl, getInitials, formatTaskText } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle, Ticket, MoreHorizontal, Edit, Trash2, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import TaskAttachmentList from './TaskAttachmentList';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TaskDetailCard from './TaskDetailCard';
import { useMemo } from 'react';
import TaskReactions from './TaskReactions';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useQueryClient } from '@tanstack/react-query';

interface TasksKanbanCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

// Utility function to aggregate attachments
const aggregateAttachments = (task: Task): TaskAttachment[] => {
  let attachments: TaskAttachment[] = [...(task.attachments || [])];
  if (task.ticket_attachments && task.ticket_attachments.length > 0) {
    const existingUrls = new Set(attachments.map(a => a.file_url));
    const uniqueTicketAttachments = task.ticket_attachments.filter(
      (ticketAtt) => !attachments.some((att) => att.file_url === ticketAtt.file_url)
    );
    attachments = [...attachments, ...uniqueTicketAttachments];
  }
  return attachments;
};

const TasksKanbanCard = ({ task, onEdit, onDelete }: TasksKanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const queryClient = useQueryClient();
  const { toggleTaskReaction } = useTaskMutations(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['project'] });
  });

  const priorityStyle = getPriorityStyles(task.priority);
  const allAttachments = useMemo(() => aggregateAttachments(task), [task]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    borderLeftColor: priorityStyle.hex,
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleToggleReaction = (emoji: string) => {
    toggleTaskReaction({ taskId: task.id, emoji });
  };

  const renderAttachments = () => {
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
    >
      <CardHeader className="p-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm leading-snug flex items-center gap-1.5 pr-2">
            {task.status === 'Done' && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
              {formatTaskText(task.title)}
            </ReactMarkdown>
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
          {task.project_name && task.project_name !== 'General Tasks' && (
            <div className="text-xs text-muted-foreground">
              <Link to={`/projects/${task.project_slug}`} className="hover:underline text-primary break-words">
                {task.project_name}
              </Link>
            </div>
          )}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2" title={formatTaskText(task.description)}>
              {formatTaskText(task.description)}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center -space-x-2">
            {(task.assignedTo && task.assignedTo.length > 0)
              ? task.assignedTo.map((user) => {
                const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || (user as any).name;
                return (
                  <TooltipProvider key={user.id}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Avatar className="h-6 w-6 border-2 border-background">
                          <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                          <AvatarFallback style={generatePastelColor(user.id)}>
                            {getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{[user.first_name, user.last_name].filter(Boolean).join(' ')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              })
              : <div className="h-6 w-6" />
            }
          </div>
          <div className="flex items-center gap-2">
            {(task.originTicketId || task.tags?.some(t => t.name === 'Ticket')) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Ticket className={cn("h-4 w-4 flex-shrink-0", task.status === 'Done' ? 'text-green-500' : 'text-red-500')} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This is a ticket</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {renderAttachments()}
            {task.due_date && (
              <div className={cn("text-xs text-muted-foreground", isOverdue(task.due_date) && "text-red-600 font-bold")}>
                due {format(new Date(task.due_date), "MMM d")}
              </div>
            )}
          </div>
        </div>
        <div className="mt-2 pt-2 border-t">
          <TaskReactions reactions={task.reactions || []} onToggleReaction={handleToggleReaction} />
        </div>
      </CardContent>
    </Card>
  );
};

export default TasksKanbanCard;