import React, { useMemo } from 'react';
import { Task, TaskAttachment, Reaction, User } from '@/types';
import { DrawerContent } from '@/components/ui/drawer';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { cn, isOverdue, formatTaskText, getPriorityStyles, getTaskStatusStyles, getDueDateClassName, getAvatarUrl, generatePastelColor, getInitials } from '@/lib/utils';
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
  Tag,
  User as UserIcon,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TaskAttachmentList from './TaskAttachmentList';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Link } from 'react-router-dom';
import TaskDiscussion from './TaskDiscussion';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface TaskDetailCardProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const aggregateAttachments = (task: Task): TaskAttachment[] => {
  const allAttachments: TaskAttachment[] = [];
  const seenUrls = new Set<string>();

  // 1. Attachments directly on the task
  if (task.attachments) {
    for (const att of task.attachments) {
      if (att.file_url && !seenUrls.has(att.file_url)) {
        allAttachments.push(att);
        seenUrls.add(att.file_url);
      }
    }
  }

  // 2. Attachments from the original ticket comment (JSONB field)
  if (task.ticket_attachments) {
    for (const ticketAtt of task.ticket_attachments) {
      if (ticketAtt.file_url && !seenUrls.has(ticketAtt.file_url)) {
        allAttachments.push({
          id: ticketAtt.id || ticketAtt.file_url,
          file_name: ticketAtt.file_name,
          file_url: ticketAtt.file_url,
          file_type: ticketAtt.file_type || null,
          file_size: ticketAtt.file_size || null,
          storage_path: ticketAtt.storage_path || '',
          created_at: ticketAtt.created_at || task.created_at,
        });
        seenUrls.add(ticketAtt.file_url);
      }
    }
  }

  // 3. Legacy single attachment from the original ticket comment
  if (task.attachment_url && task.attachment_name) {
    if (!seenUrls.has(task.attachment_url)) {
      allAttachments.push({
        id: task.origin_ticket_id || `legacy-${task.id}`,
        file_name: task.attachment_name,
        file_url: task.attachment_url,
        file_type: null,
        file_size: null,
        storage_path: '',
        created_at: task.created_at,
      });
      seenUrls.add(task.attachment_url);
    }
  }

  return allAttachments;
};

const TaskDetailCard: React.FC<TaskDetailCardProps> = ({ task, onClose, onEdit, onDelete }) => {
  const queryClient = useQueryClient();
  const { toggleTaskReaction, sendReminder } = useTaskMutations();
  const [showFullDescription, setShowFullDescription] = useState(false);

  const allAttachments = useMemo(() => (task ? aggregateAttachments(task) : []), [task]);

  const allTags = useMemo(() => {
    const tags = [...(task?.tags || [])];
    if (task?.origin_ticket_id) {
      const hasTicketTag = tags.some(t => t.name.toLowerCase() === 'ticket');
      if (!hasTicketTag) {
        tags.push({
          id: 'ticket-tag',
          name: 'Ticket',
          color: '#8B5CF6', // Default purple color for tickets
          user_id: task.created_by.id,
        });
      }
    }
    return tags;
  }, [task?.tags, task?.origin_ticket_id, task?.created_by.id]);

  if (!task) {
    return (
      <DrawerContent>
        <div className="mx-auto w-full max-w-[650px] grid place-items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DrawerContent>
    );
  }

  const description = task.description || '';
  const isLongDescription = description.length > 500;
  const displayedDescription = isLongDescription && !showFullDescription
    ? `${description.substring(0, 500)}...`
    : description;

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

  return (
    <DrawerContent>
      <div className="mx-auto w-full max-w-[650px] flex flex-col max-h-[90vh]">
        <div className="flex-shrink-0 p-4 pt-3">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted" />
        </div>

        <div className="flex-shrink-0 border-b border-border px-4 pb-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-base sm:text-lg font-semibold leading-none tracking-tight">
                {task.origin_ticket_id && <Ticket className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
                {allAttachments.length > 0 && <Paperclip className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground" />}
                <span className={cn("min-w-0 break-words", task.completed && "line-through text-muted-foreground")}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: "span" }}>
                    {formatTaskText(task.title)}
                  </ReactMarkdown>
                </span>
              </div>
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
                <DropdownMenuItem onSelect={() => { onDelete(task.id); onClose(); }} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 text-sm space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-500 scrollbar-track-transparent">
          {task.description && (
            <div className="border-b pb-4">
              <h4 className="font-semibold mb-2 text-sm">Description</h4>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ node, ...props }) => {
                      const href = props.href || '';
                      if (href.startsWith('/')) {
                        return <Link to={href} {...props} className="text-primary hover:underline" />;
                      }
                      return <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />;
                    }
                  }}
                >
                  {displayedDescription}
                </ReactMarkdown>
              </div>
              {isLongDescription && (
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs mt-2"
                  onClick={() => setShowFullDescription(!showFullDescription)}
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </Button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="flex items-start gap-3">
              <Briefcase className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-semibold">Project</p>
                {task.project_name ? (
                  <Link to={`/projects/${task.project_slug}`} className="hover:underline text-primary break-words" onClick={onClose}>
                    {task.project_name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">General Tasks</span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-semibold">Due Date</p>
                {task.due_date ? (
                  <span className={cn(getDueDateClassName(task.due_date, task.completed))}>
                    {format(new Date(task.due_date), "MMM d, yyyy, p")}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No due date</span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-semibold">Status</p>
                <Badge className={cn(getTaskStatusStyles(task.status).tw, "border-transparent text-xs")}>
                  {task.status}
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Flag className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-semibold">Priority</p>
                <Badge className={cn(getPriorityStyles(task.priority).tw, "text-xs")}>
                  {task.priority || "Low"}
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserIcon className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-semibold">Created by</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={getAvatarUrl(task.created_by.avatar_url, task.created_by.id)} />
                    <AvatarFallback style={generatePastelColor(task.created_by.id)}>
                      {getInitials(task.created_by.name, task.created_by.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{task.created_by.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-semibold">Assignees</p>
                {task.assignedTo && task.assignedTo.length > 0 ? (
                  <div className="flex items-center -space-x-2 mt-1">
                    <TooltipProvider>
                      {task.assignedTo.map(user => (
                        <Tooltip key={user.id}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-6 w-6 border-2 border-background">
                              <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                              <AvatarFallback style={generatePastelColor(user.id)}>
                                {getInitials(user.name, user.email)}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent><p>{user.name}</p></TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Not assigned</p>
                )}
              </div>
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex items-start gap-2 border-t pt-4">
              <Tag className="h-4 w-4 mt-1 text-muted-foreground" />
              <div className="flex gap-1 flex-wrap">
                {allTags.map((tag) => (
                  <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }} className="text-xs">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {allAttachments.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                <Paperclip className="h-4 w-4" /> Attachments ({allAttachments.length})
              </h4>
              <TaskAttachmentList attachments={allAttachments} />
            </div>
          )}

          <TaskDiscussion task={task} onToggleReaction={handleToggleReaction} />
        </div>
      </div>
    </DrawerContent>
  );
};

export default TaskDetailCard;