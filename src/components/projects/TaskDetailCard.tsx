import React from 'react';
import { Task, TaskAttachment } from '@/types';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
    <DialogContent className="sm:max-w-[650px] max-h-[400px] overflow-y-auto p-0">
      <DialogHeader className="px-4 pt-4 pb-2">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <DialogTitle className="flex items-center gap-2">
              {task.originTicketId && <Ticket className="h-5 w-5 flex-shrink-0" />}
              <span className={cn("min-w-0 break-words", task.completed && 'line-through text-muted-foreground')}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: 'span' }}>
                  {formatTaskText(task.title)}
                </ReactMarkdown>
              </span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Created on {format(new Date(task.created_at), "MMM d, yyyy")}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="hover:bg-accent" onClick={() => { onEdit(task); onClose(); }}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-destructive hover:text-destructive-foreground" onClick={() => { onDelete(task.id); onClose(); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogHeader>
      <div className="w-4/5 mx-auto h-[2px] bg-primary" />
      
      <div className="grid gap-4 p-4">
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

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold flex items-center gap-2 flex-shrink-0"><Briefcase className="h-4 w-4" /> Project</h4>
            {task.project_name && task.project_name !== 'General Tasks' ? (
              <Link to={`/projects/${task.project_slug}`} className="hover:underline text-primary break-words" onClick={onClose}>
                {task.project_name}
              </Link>
            ) : <span className="text-muted-foreground">General Tasks</span>}
          </div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold flex items-center gap-2 flex-shrink-0"><Calendar className="h-4 w-4" /> Due Date</h4>
            {task.due_date ? (
              <span className={cn(isOverdue(task.due_date) && "text-red-600 font-bold")}>
                {format(new Date(task.due_date), "MMM d, yyyy")}
              </span>
            ) : <span className="text-muted-foreground">No due date</span>}
          </div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Status</h4>
            <Badge className={cn(statusStyle.tw, 'border-transparent')}>{task.status}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Priority</h4>
            <Badge className={priorityStyle.tw}>{task.priority || 'Low'}</Badge>
          </div>
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex items-start gap-2">
            <h4 className="font-semibold flex items-center gap-2 flex-shrink-0"><Tag className="h-4 w-4" /> Tags</h4>
            <div className="flex gap-1 flex-wrap">
              {task.tags.map(tag => (
                <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>{tag.name}</Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            {task.created_by && (
              <div className="flex items-center gap-2 text-sm">
                <h4 className="font-semibold">Created By</h4>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getAvatarUrl(task.created_by.avatar_url, task.created_by.id)} />
                  <AvatarFallback style={generatePastelColor(task.created_by.id)}>
                    {getInitials([task.created_by.first_name, task.created_by.last_name].filter(Boolean).join(' '), task.created_by.email || undefined)}
                  </AvatarFallback>
                </Avatar>
                <span>{[task.created_by.first_name, task.created_by.last_name].filter(Boolean).join(' ')}</span>
              </div>
            )}
          </div>
          <div>
            {task.assignedTo && task.assignedTo.length > 0 && (
              <div className="flex items-center gap-2">
                <h4 className="font-semibold flex items-center gap-2 flex-shrink-0"><UserIcon className="h-4 w-4" /> Assignees</h4>
                <div className="flex -space-x-2">
                  {task.assignedTo.map((user) => (
                    <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
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
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2"><Paperclip className="h-4 w-4" /> Attachments</h4>
            <TaskAttachmentList attachments={allAttachments} />
          </div>
        )}
      </div>
    </DialogContent>
  );
};

export default TaskDetailCard;