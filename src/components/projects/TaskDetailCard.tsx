import React, { useMemo } from 'react';
import { Task, TaskAttachment, ProjectStatus } from '@/types';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { format, isAfter, subHours } from 'date-fns';
import {
  cn,
  getPriorityStyles,
  getTaskStatusStyles,
  isOverdue,
  formatTaskText,
} from '@/lib/utils';
import {
  Edit,
  Trash2,
  Ticket,
  Paperclip,
  Link as LinkIcon,
  MoreHorizontal,
  BellRing,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TaskAttachmentList from './TaskAttachmentList';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useProjectMutations } from '@/hooks/useProjectMutations';
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

const getDueDateClassName = (dueDateStr: string | null, completed: boolean): string => {
  if (!dueDateStr || completed) return 'text-muted-foreground';
  const dueDate = new Date(dueDateStr);
  const diff = (dueDate.getTime() - Date.now()) / 36e5;
  if (diff < 0) return 'text-red-600 font-bold';
  if (diff <= 1) return 'text-primary font-bold';
  if (diff <= 24) return 'text-primary';
  return 'text-muted-foreground';
};

const TaskDetailCard: React.FC<TaskDetailCardProps> = ({ task, onClose, onEdit, onDelete }) => {
  const queryClient = useQueryClient();
  const { toggleTaskReaction, sendReminder, isSendingReminder } = useTaskMutations(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['project'] });
  });
  const { updateProjectStatus } = useProjectMutations(task.project_slug);
  const scrollRef = useDragScrollY<HTMLDivElement>();

  const allAttachments = useMemo(() => aggregateAttachments(task), [task]);

  if (!task) return null;

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
    navigator.clipboard.writeText(`${task.project_name} | ${task.title}\n${url}`);
    toast.success("Link copied!");
  };

  const handleSendReminder = () => sendReminder(task.id);

  // ✅ Final layout
  return (
    <DialogContent className="w-[90vw] max-w-[650px] grid grid-rows-[auto_1fr] max-h-[85vh] p-0 rounded-lg overflow-hidden">
      {/* HEADER */}
      <DialogHeader className="p-3 sm:p-4 border-b-[3px] border-primary bg-background z-10">
        <div className="flex justify-between items-start gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {task.originTicketId && <Ticket className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
              {allAttachments.length > 0 && (
                <Paperclip className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground" />
              )}
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
            <p className="text-xs text-muted-foreground mt-1">
              Created on {format(new Date(task.created_at), 'MMM d, yyyy')}
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

      {/* BODY — full draggable scroll */}
      <div
        ref={scrollRef}
        className="relative h-full overflow-y-auto p-4 space-y-4 cursor-grab active:cursor-grabbing select-none"
      >
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

        {allAttachments.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
              <Paperclip className="h-4 w-4" /> Attachments
            </h4>
            <TaskAttachmentList attachments={allAttachments} />
          </div>
        )}

        <div className="border-t pt-4">
          <TaskDiscussion task={task} onToggleReaction={handleToggleReaction} />
        </div>
      </div>
    </DialogContent>
  );
};

export default TaskDetailCard;