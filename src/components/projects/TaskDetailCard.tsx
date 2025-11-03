import React, { useMemo } from 'react';
import { Task, TaskAttachment, Reaction } from '@/types';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { cn, isOverdue, formatTaskText, getPriorityStyles, getTaskStatusStyles, getDueDateClassName } from '@/lib/utils';
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
  CheckCircle,
  Tag
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TaskAttachmentList from './TaskAttachmentList';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Link } from 'react-router-dom';
import TaskFooter from './TaskFooter';
import { Badge } from '../ui/badge';
import TaskDiscussion from './TaskDiscussion';

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
    <DialogContent
      className="w-[90vw] max-w-[650px] max-h-[85vh] 
                 p-0 rounded-lg bg-background 
                 overflow-y-auto scrollbar-thin 
                 scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-500 
                 scrollbar-track-transparent"
    >
      {/* Sticky Header */}
      <DialogHeader className="sticky top-0 z-10 bg-background border-b border-border p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {task.originTicketId && (
                <Ticket className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              )}
              {allAttachments.length > 0 && (
                <Paperclip className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground" />
              )}
              <span
                className={cn(
                  "min-w-0 break-words",
                  task.completed && "line-through text-muted-foreground"
                )}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: "span" }}>
                  {formatTaskText(task.title)}
                </ReactMarkdown>
              </span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Created on {format(new Date(task.created_at), "MMM d, yyyy")}
            </p>
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
                onSelect={() => { onDelete(task.id); onClose(); }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DialogHeader>

      {/* Scrollable Content */}
      <div className="p-4 text-sm space-y-4">
        {task.description && (
          <div className="border-b pb-4">
            <h4 className="font-semibold mb-2 text-sm">Description</h4>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground break-all">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {formatTaskText(task.description)}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Project, due date, status, priority */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            {task.project_name ? (
              <Link
                to={`/projects/${task.project_slug}`}
                className="hover:underline text-primary break-words"
                onClick={onClose}
              >
                {task.project_name}
              </Link>
            ) : (
              <span className="text-muted-foreground">General Tasks</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {task.due_date ? (
              <span className={cn(getDueDateClassName(task.due_date, task.completed))}>
                {format(new Date(task.due_date), "MMM d, yyyy, p")}
              </span>
            ) : (
              <span className="text-muted-foreground">No due date</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Status</h4>
            <Badge className={cn(getTaskStatusStyles(task.status).tw, "border-transparent text-xs")}>
              {task.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Priority</h4>
            <Badge className={cn(getPriorityStyles(task.priority).tw, "text-xs")}>
              {task.priority || "Low"}
            </Badge>
          </div>
        </div>

        {/* Tags */}
        {task.tags?.length > 0 && (
          <div className="flex items-start gap-2">
            <Tag className="h-4 w-4 mt-1 text-muted-foreground" />
            <div className="flex gap-1 flex-wrap">
              {task.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  style={{ borderColor: tag.color, color: tag.color }}
                  className="text-xs"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {allAttachments.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
              <Paperclip className="h-4 w-4" /> Attachments ({allAttachments.length})
            </h4>
            <TaskAttachmentList attachments={allAttachments} />
          </div>
        )}

        {/* Footer Reactions and Discussion */}
        <TaskDiscussion task={task} onToggleReaction={handleToggleReaction} />
      </div>
    </DialogContent>
  );
};

export default TaskDetailCard;