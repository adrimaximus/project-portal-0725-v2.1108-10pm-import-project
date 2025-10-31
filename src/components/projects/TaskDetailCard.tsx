import React, { useMemo } from 'react';
import { Task, TaskAttachment, Reaction, User } from '@/types';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { format, isAfter, subHours } from 'date-fns';
import { generatePastelColor, getPriorityStyles, getTaskStatusStyles, isOverdue, cn, getAvatarUrl, getInitials, formatTaskText } from '@/lib/utils';
import { Edit, Trash2, Ticket, Paperclip, User as UserIcon, Calendar, Tag, Briefcase, Link as LinkIcon, MoreHorizontal, BellRing } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TaskAttachmentList from './TaskAttachmentList';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import TaskDiscussion from './TaskDiscussion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface TaskDetailCardProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

// Utility function to aggregate attachments
const aggregateAttachments = (task: Task): TaskAttachment[] => {
  let attachments: TaskAttachment[] = [...(task.attachments || [])];
  
  // 1. Add attachments from the modern ticket_attachments field (JSONB)
  if (task.ticket_attachments && task.ticket_attachments.length > 0) {
    const existingUrls = new Set(attachments.map(a => a.file_url));
    const uniqueTicketAttachments = task.ticket_attachments.filter(
      (ticketAtt) => ticketAtt.file_url && !existingUrls.has(ticketAtt.file_url)
    );
    attachments = [...attachments, ...uniqueTicketAttachments];
  }

  // 2. Add attachment from legacy fields if it exists and is not already included
  if (task.attachment_url && task.attachment_name) {
    const existingUrls = new Set(attachments.map(a => a.file_url));
    if (!existingUrls.has(task.attachment_url)) {
      attachments.push({
        id: task.originTicketId || `legacy-${task.id}`, // Use origin ticket ID if available
        file_name: task.attachment_name,
        file_url: task.attachment_url,
        file_type: null,
        file_size: null,
        storage_path: '', // Not available for legacy
        created_at: task.created_at, // Approximate time
      });
    }
  }

  return attachments;
};

const getDueDateClassName = (dueDateStr: string | null, completed: boolean): string => {
  if (!dueDateStr || completed) {
    return "text-muted-foreground";
  }

  const dueDate = new Date(dueDateStr);
  const now = new Date();
  const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0) {
    return "text-red-600 font-bold"; // Overdue
  }
  if (diffHours <= 1) {
    return "text-primary font-bold"; // Due within 1 hour
  }
  if (diffHours <= 24) {
    return "text-primary"; // Due within 1 day
  }
  return "text-muted-foreground"; // Not due soon
};

const TaskDetailCard: React.FC<TaskDetailCardProps> = ({ task, onClose, onEdit, onDelete }) => {
  const queryClient = useQueryClient();
  const { toggleTaskReaction } = useTaskMutations();

  const allAttachments = useMemo(() => {
    if (!task) return [];
    return aggregateAttachments(task);
  }, [task]);

  if (!task) return null;

  const handleToggleReaction = (emoji: string) => {
    toggleTaskReaction({ taskId: task.id, emoji }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['project'] });
      }
    });
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/tasks/${task.id}`;
    const textToCopy = `${task.project_name || 'Project'} | ${task.title}\n${url}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Link to task copied to clipboard!");
  };

  const statusStyle = getTaskStatusStyles(task.status);
  const priorityStyle = getPriorityStyles(task.priority);
  const wasReminderSentRecently = task.last_reminder_sent_at && isAfter(new Date(task.last_reminder_sent_at), subHours(new Date(), 25));

  return (
    <DialogContent className="w-[90vw] max-w-[650px] max-h-[85vh] p-0 rounded-lg overflow-hidden">
      <div className="h-full overflow-y-auto">
        <DialogHeader className="p-3 sm:p-4 border-b-[3px] border-primary sticky top-0 bg-background z-10">
          <div className="flex justify-between items-start gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                {task.originTicketId && <Ticket className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
                {allAttachments.length > 0 && <Paperclip className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground" />}
                <span className={cn("min-w-0 break-words", task.completed && 'line-through text-muted-foreground')}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
                    {formatTaskText(task.title)}
                  </ReactMarkdown>
                </span>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Created on {format(new Date(task.created_at), "MMM d, yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-0 sm:gap-1 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => { onEdit(task); onClose(); }}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleCopyLink}>
                    <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { onDelete(task.id); onClose(); }} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 text-xs sm:text-sm">
          {task.description && (
            <div className="border-b pb-3 sm:pb-4">
              <h4 className="font-semibold mb-2 text-xs sm:text-sm">Description</h4>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground break-all">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {formatTaskText(task.description)}
                </ReactMarkdown>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <TooltipProvider><Tooltip><TooltipTrigger><Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Project</p></TooltipContent></Tooltip></TooltipProvider>
              {task.project_name && task.project_name !== 'General Tasks' ? (
                <Link to={`/projects/${task.project_slug}`} className="hover:underline text-primary break-words" onClick={onClose}>
                  {task.project_name}
                </Link>
              ) : <span className="text-muted-foreground">General Tasks</span>}
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider><Tooltip><TooltipTrigger><Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Due Date</p></TooltipContent></Tooltip></TooltipProvider>
              {task.due_date ? (
                <div className="flex items-center gap-1.5">
                  <span className={cn(getDueDateClassName(task.due_date, task.completed))}>
                    {format(new Date(task.due_date), "MMM d, yyyy, p")}
                  </span>
                  {wasReminderSentRecently && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <BellRing className="h-3.5 w-3.5 text-blue-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>A reminder was sent recently.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ) : <span className="text-muted-foreground">No due date</span>}
            </div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Status</h4>
              <Badge className={cn(statusStyle.tw, 'border-transparent text-xs')}>{task.status}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Priority</h4>
              <Badge className={cn(priorityStyle.tw, 'text-xs')}>{task.priority || 'Low'}</Badge>
            </div>
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="flex items-start gap-2">
              <TooltipProvider><Tooltip><TooltipTrigger><Tag className="h-3 w-3 sm:h-4 sm:w-4 mt-1 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Tags</p></TooltipContent></Tooltip></TooltipProvider>
              <div className="flex gap-1 flex-wrap">
                {task.tags.map(tag => (
                  <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }} className="text-xs">{tag.name}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              {task.created_by && (
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">Created By</h4>
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                    <AvatarImage src={getAvatarUrl(task.created_by.avatar_url, task.created_by.id)} />
                    <AvatarFallback style={generatePastelColor(task.created_by.id)}>
                      {getInitials([task.created_by.first_name, task.created_by.last_name].filter(Boolean).join(' '), task.created_by.email || undefined)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
            <div>
              {task.assignedTo && task.assignedTo.length > 0 && (
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold flex items-center gap-2 flex-shrink-0"><UserIcon className="h-3 w-3 sm:h-4 sm:w-4" /> Assignees</h4>
                  <div className="flex -space-x-2">
                    {task.assignedTo.map((user) => (
                      <TooltipProvider key={user.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to="/chat" state={{ selectedCollaborator: user }}>
                              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-background">
                                <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                                <AvatarFallback style={generatePastelColor(user.id)}>
                                  {getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{[user.first_name, user.last_name].filter(Boolean).join(' ')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {allAttachments.length > 0 && (
            <div className="border-t pt-3 sm:pt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-xs sm:text-sm"><Paperclip className="h-3 w-3 sm:h-4 sm:w-4" /> Attachments</h4>
              <TaskAttachmentList attachments={allAttachments} />
            </div>
          )}

          <div className="border-t pt-3 sm:pt-4">
            <TaskDiscussion task={task} onToggleReaction={handleToggleReaction} />
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

export default TaskDetailCard;