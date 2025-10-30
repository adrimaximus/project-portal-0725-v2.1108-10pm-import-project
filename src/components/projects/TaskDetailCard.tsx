import React, { useMemo, useState } from 'react';
import { Task, TaskAttachment } from '@/types';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { cn, formatTaskText } from '@/lib/utils';
import { Edit, Trash2, Ticket, Paperclip, Link as LinkIcon, MoreHorizontal, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TaskAttachmentList from './TaskAttachmentList';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import TaskDiscussion from './TaskDiscussion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion, useDragControls } from 'framer-motion';
import TaskReactions from './TaskReactions';
import TaskDetailsSection from './TaskDetailsSection';

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

const TaskDetailCard: React.FC<TaskDetailCardProps> = ({ task, onClose, onEdit, onDelete }) => {
  const queryClient = useQueryClient();
  const { toggleTaskReaction } = useTaskMutations();
  const descriptionIsLong = task.description && task.description.length > 200;
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(!descriptionIsLong);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(true);
  const dragControls = useDragControls();

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

  return (
    <DialogContent 
      className="bg-transparent border-none shadow-none p-0 w-auto max-w-[650px] h-[85vh]"
    >
      <motion.div
        drag
        dragMomentum={false}
        dragControls={dragControls}
        dragListener={false}
        className="w-[90vw] max-w-[650px] h-full rounded-lg overflow-hidden bg-background border shadow-lg flex flex-col"
      >
        <DialogHeader 
          onPointerDown={(e) => dragControls.start(e)}
          className="p-3 sm:p-4 border-b-[3px] border-primary sticky top-0 bg-background z-10 cursor-grab active:cursor-grabbing drag-handle"
        >
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
              <TaskReactions reactions={task.reactions || []} onToggleReaction={handleToggleReaction} />
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
        
        <div className="flex-1 overflow-y-scroll min-h-0 p-3 sm:p-4 space-y-3 sm:space-y-4 text-xs sm:text-sm">
          {task.description && (
            <Collapsible
              open={isDescriptionOpen}
              onOpenChange={setIsDescriptionOpen}
              className="border-b"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left text-xs sm:text-sm">
                <h4 className="font-semibold">Description</h4>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isDescriptionOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-3 sm:pb-4">
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground break-all">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {formatTaskText(task.description)}
                  </ReactMarkdown>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <TaskDetailsSection task={task} onClose={onClose} />

          {allAttachments.length > 0 && (
            <Collapsible
              open={isAttachmentsOpen}
              onOpenChange={setIsAttachmentsOpen}
              className="border-t"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between py-3 sm:py-4 text-left text-xs sm:text-sm">
                <h4 className="font-semibold flex items-center gap-2">
                  <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" /> 
                  Attachments ({allAttachments.length})
                </h4>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isAttachmentsOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-3 sm:pb-4">
                <TaskAttachmentList attachments={allAttachments} />
              </CollapsibleContent>
            </Collapsible>
          )}

          <div className="border-t pt-3 sm:pt-4">
            <TaskDiscussion task={task} onToggleReaction={handleToggleReaction} />
          </div>
        </div>
      </motion.div>
    </DialogContent>
  );
};

export default TaskDetailCard;