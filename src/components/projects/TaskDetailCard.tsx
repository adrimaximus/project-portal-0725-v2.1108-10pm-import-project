import React, { useMemo } from 'react';
import { Task, TaskAttachment, Reaction, User } from '@/types';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { cn, isOverdue, formatTaskText, getPriorityStyles, getAvatarUrl, generatePastelColor, getInitials } from '@/lib/utils';
import {
  Edit,
  Trash2,
  Ticket,
  Paperclip,
  Link as LinkIcon,
  MoreHorizontal,
  BellRing,
  Loader2,
  Calendar,
  Briefcase,
  Users,
  Flag,
  CheckCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TaskAttachmentList from './TaskAttachmentList';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import TaskDiscussion from './TaskDiscussion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useDragScrollY } from '@/hooks/useDragScrollY';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface TaskDetailCardProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const aggregateAttachments = (task: Task): TaskAttachment[] => {
  let attachments: TaskAttachment[] = [...(task.attachments || [])];
  if (task.ticket_attachments?.length) {
    const existingUrls = new Set(attachments.map((a) => a.file_url));
    attachments = [
      ...attachments,
      ...task.ticket_attachments.filter(
        (att) => att.file_url && !existingUrls.has(att.file_url)
      ),
    ];
  }
  if (task.attachment_url && task.attachment_name) {
    const existingUrls = new Set(attachments.map((a) => a.file_url));
    if (!existingUrls.has(task.attachment_url)) {
      attachments.push({
        id: task.originTicketId || `legacy-${task.id}`,
        file_name: task.attachment_name,
        file_url: task.attachment_url,
        file_type: null,
        file_size: null,
        storage_path: '',
        created_at: task.created_at,
      });
    }
  }
  return attachments;
};

const TaskDetailCard: React.FC<TaskDetailCardProps> = ({ task, onClose, onEdit, onDelete }) => {
  const queryClient = useQueryClient();
  const { toggleTaskReaction, sendReminder, isSendingReminder } = useTaskMutations();
  const scrollRef = useDragScrollY<HTMLDivElement>();

  const allAttachments = useMemo(() => (task ? aggregateAttachments(task) : []), [task]);

  if (!task) {
    return (
      <DialogContent className="w-[90vw] max-w-[650px] grid place-items-center max-h-[85vh] p-0 rounded-lg overflow-hidden bg-background">
        <div className="p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DialogContent>
    );
  }

  const handleToggleReaction = (emoji: string) => {
    toggleTaskReaction(
      { taskId: task.id, emoji },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['project'] });
        },
      }
    );
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/tasks/${task.id}`;
    navigator.clipboard.writeText(`${task.project_name || 'Project'} | ${task.title}\n${url}`);
    toast.success('Link copied!');
  };

  const handleSendReminder = () => sendReminder(task.id);

  const priorityStyle = getPriorityStyles(task.priority);

  return (
    <DialogContent className="w-[90vw] max-w-[650px] flex flex-col max-h-[85vh] p-0 rounded-lg overflow-hidden">
      <DialogHeader className="p-3 sm:p-4 border-b bg-background z-10 flex-shrink-0">
        <div className="flex justify-between items-start gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {task.originTicketId && <Ticket className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
              <span
                className={cn(
                  'min-w-0 break-words',
                  task.completed && 'line-through text-muted-foreground'
                )}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
                  {formatTaskText(task.title)}
                </ReactMarkdown>
              </span>
            </DialogTitle>
          </div>

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
              <DropdownMenuItem
                onSelect={handleSendReminder}
                disabled={!isOverdue(task.due_date) || task.completed || isSendingReminder}
              >
                <BellRing className="mr-2 h-4 w-4" /> Send Reminder
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => { onDelete(task.id); onClose(); }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DialogHeader>

      <div
        ref={scrollRef}
        className="relative flex-grow overflow-y-auto p-4 space-y-4 cursor-grab active:cursor-grabbing select-none"
      >
        {/* Metadata Section */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">Status</p>
              <p className="font-semibold">{task.status}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">Due Date</p>
              <p className={cn("font-semibold", isOverdue(task.due_date) && !task.completed && "text-destructive")}>
                {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy, p') : 'No due date'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Briefcase className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">Project</p>
              <Link to={`/projects/${task.project_slug}`} className="font-semibold text-primary hover:underline">{task.project_name}</Link>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Flag className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">Priority</p>
              <p className="font-semibold" style={{ color: priorityStyle.hex }}>{task.priority}</p>
            </div>
          </div>
          <div className="col-span-2 flex items-start gap-3">
            <Users className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">Assignees</p>
              <div className="flex items-center -space-x-2 mt-1">
                {(task.assignedTo && task.assignedTo.length > 0)
                  ? task.assignedTo.map((user) => (
                      <TooltipProvider key={user.id}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Avatar className="h-7 w-7 border-2 border-background">
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
                    ))
                  : <p className="text-sm text-muted-foreground">Not assigned</p>
                }
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {task.description && (
          <div>
            <h4 className="font-semibold mb-2 text-sm">Description</h4>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground break-all">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {formatTaskText(task.description)}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {allAttachments.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
              <Paperclip className="h-4 w-4" /> Attachments
            </h4>
            <TaskAttachmentList attachments={allAttachments} />
          </div>
        )}

        <div>
          <TaskDiscussion task={task} onToggleReaction={handleToggleReaction} />
        </div>
      </div>
    </DialogContent>
  );
};

export default TaskDetailCard;