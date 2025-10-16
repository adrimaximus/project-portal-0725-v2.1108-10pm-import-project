import React from 'react';
import { Task, TaskAttachment } from '@/types';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { generatePastelColor, getPriorityStyles, getTaskStatusStyles, isOverdue, cn, getAvatarUrl, getInitials, formatTaskText } from '@/lib/utils';
import { Edit, Trash2, Ticket, Paperclip, User as UserIcon, Calendar, Tag, Briefcase } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TaskAttachmentList from './TaskAttachmentList';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface TaskDetailCardProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TaskDetailCard: React.FC<TaskDetailCardProps> = ({ task, onClose, onEdit, onDelete }) => {
  if (!task) return null;

  const statusStyle = getTaskStatusStyles(task.status);
  const priorityStyle = getPriorityStyles(task.priority);

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

  return (
    <DialogContent className="w-[80vw] sm:w-full sm:max-w-[650px] max-h-[80vh] overflow-y-auto p-0 border border-primary rounded-lg">
      <DialogHeader className="p-3 sm:p-4 border-b-2 border-primary">
        <div className="flex justify-between items-start gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {task.originTicketId && <Ticket className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
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
            <Button variant="ghost" size="icon" className="hover:bg-accent h-7 w-7 sm:h-8 sm:w-8" onClick={() => { onEdit(task); onClose(); }}>
              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-destructive hover:text-destructive-foreground h-7 w-7 sm:h-8 sm:w-8" onClick={() => { onDelete(task.id); onClose(); }}>
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </DialogHeader>
      
      <div className="grid gap-3 sm:gap-4 p-3 sm:p-4 text-xs sm:text-sm">
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
              <span className={cn(isOverdue(task.due_date) && "text-red-600 font-bold")}>
                {format(new Date(task.due_date), "MMM d, yyyy")}
              </span>
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
                    <Avatar key={user.id} className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-background">
                      <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                      <AvatarFallback style={generatePastelColor(user.id)}>
                        {getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}
                      </AvatarFallback>
                    </Avatar>
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
      </div>
    </DialogContent>
  );
};

export default TaskDetailCard;