import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Task, TaskAttachment, Reaction, User, Comment as CommentType, TaskStatus, TASK_STATUS_OPTIONS } from '@/types';
import { DrawerContent } from '@/components/ui/drawer';
import { Button } from '../ui/button';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { cn, isOverdue, formatTaskText, getPriorityStyles, getTaskStatusStyles, getDueDateClassName, getAvatarUrl, generatePastelColor, getInitials, formatMentionsForDisplay } from '@/lib/utils';
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
  ChevronDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import TaskAttachmentList from '../projects/TaskAttachmentList';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Link } from 'react-router-dom';
import TaskCommentsList from './TaskCommentsList';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import CommentInput from '../CommentInput';
import { useProfiles } from '@/hooks/useProfiles';
import { useCommentManager } from '@/hooks/useCommentManager';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useTaskModal } from '@/contexts/TaskModalContext';
import { Input } from '../ui/input';

interface TaskDetailCardProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const aggregateAttachments = (task: Task): TaskAttachment[] => {
  let attachments: TaskAttachment[] = [...(task.attachments || [])];
  
  if (task.ticket_attachments && task.ticket_attachments.length > 0) {
    const existingUrls = new Set(attachments.map(a => a.file_url));
    const uniqueTicketAttachments = task.ticket_attachments.filter(
      (ticketAtt) => ticketAtt.file_url && !existingUrls.has(ticketAtt.file_url)
    );
    attachments = [...attachments, ...uniqueTicketAttachments];
  }

  if (task.attachment_url && task.attachment_name) {
    const existingUrls = new Set(attachments.map((a) => a.file_url));
    if (!existingUrls.has(task.attachment_url)) {
      attachments.push({
        id: task.origin_ticket_id || `legacy-${task.id}`, // Use origin ticket ID if available
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
  const { user } = useAuth();
  const { 
    toggleTaskReaction, 
    sendReminder, 
    isSendingReminder, 
    updateTaskStatusAndOrder,
    toggleTaskCompletion,
    updateTask,
    isUpdatingTask,
  } = useTaskMutations();
  const { 
    comments, 
    isLoadingComments, 
    addComment, 
    updateComment, 
    deleteComment, 
    toggleReaction 
  } = useCommentManager({ scope: { taskId: task.id, projectId: task.project_id } });
  
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<{ setText: (text: string, append?: boolean) => void, focus: () => void }>(null);
  const { data: allUsers = [] } = useProfiles();
  const { onOpen: onOpenTaskModal } = useTaskModal();
  const [replyTo, setReplyTo] = useState<CommentType | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  useEffect(() => {
    setEditedTitle(task.title);
  }, [task.title]);

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      updateTask({ taskId: task.id, updates: { title: editedTitle } });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
    }
  };

  const handleToggleCompletion = () => {
    if (toggleTaskCompletion) {
      toggleTaskCompletion({ task, completed: !task.completed });
    }
  };

  const handleAddComment = (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => {
    addComment.mutate({ text, isTicket, attachments, replyToId: replyTo?.id });
    setReplyTo(null);
  };

  const handleEditClick = (comment: CommentType) => {
    setEditingCommentId(comment.id);
    setEditedText(comment.text || '');
    setNewAttachments([]);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedText('');
    setNewAttachments([]);
  };

  const handleSaveEdit = () => {
    if (editingCommentId) {
      updateComment.mutate({ commentId: editingCommentId, text: editedText, attachments: newAttachments });
    }
    handleCancelEdit();
  };

  const handleDeleteConfirm = () => {
    if (commentToDelete) {
      deleteComment.mutate(commentToDelete.id);
      setCommentToDelete(null);
    }
  };

  const handleReply = (comment: CommentType) => {
    setReplyTo(comment);
    if (commentInputRef.current) {
      const author = comment.author as User;
      const authorName = [author.first_name, author.last_name].filter(Boolean).join(' ') || author.email;
      const mentionText = `@[${authorName}](${author.id}) `;
      commentInputRef.current.setText(mentionText, true);
      commentInputRef.current.focus();
    }
  };

  const handleCreateTicketFromComment = async (comment: CommentType) => {
    updateComment.mutate({ commentId: comment.id, text: comment.text || '', isTicket: true }, {
      onSuccess: () => {
        const fullCommentText = comment.text || '';
        const taskTitle = fullCommentText.length > 80 ? `${fullCommentText.substring(0, 80)}...` : fullCommentText;
        
        onOpenTaskModal(undefined, {
          title: taskTitle,
          description: fullCommentText,
          project_id: comment.project_id,
          status: 'To do',
          priority: 'Normal',
          due_date: null,
          origin_ticket_id: comment.id,
        });
      }
    });
  };

  const handleEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setNewAttachments(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const allAttachments = useMemo(() => (task ? aggregateAttachments(task) : []), [task]);
  const allTags = useMemo(() => {
    const tags = [...(task?.tags || [])];
    if (task?.origin_ticket_id) {
      const hasTicketTag = tags.some(t => t.name === 'Ticket');
      if (!hasTicketTag) {
        tags.push({ id: 'ticket-tag', name: 'Ticket', color: '#8B5CF6', user_id: task.created_by.id });
      }
    }
    return tags;
  }, [task?.tags, task?.origin_ticket_id, task?.created_by.id]);

  const description = task.description || '';
  const isLongDescription = description.length > 500;
  const displayedDescription = isLongDescription && !showFullDescription ? `${description.substring(0, 500)}...` : description;
  const formattedDescription = formatMentionsForDisplay(displayedDescription);

  const handleToggleReaction = (emoji: string) => {
    toggleTaskReaction({ taskId: task.id, emoji });
  };

  const handleToggleCommentReaction = (commentId: string, emoji: string) => {
    toggleReaction.mutate({ commentId, emoji });
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/tasks/${task.id}`;
    navigator.clipboard.writeText(`${task.project_name || 'Project'} | ${task.title}\n${url}`);
    toast.success('Link copied!');
  };

  const handleSendReminder = () => sendReminder(task.id);

  return (
    <>
      <DrawerContent className="mx-auto w-full max-w-[650px] flex flex-col max-h-[90vh]">
        <div className="flex-shrink-0 p-4 pt-3">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted" />
        </div>

        <div className="flex-shrink-0 border-b border-border px-4 pb-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-base sm:text-lg font-semibold leading-none tracking-tight">
                {task.origin_ticket_id && <Ticket className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
                {isEditingTitle ? (
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleTitleKeyDown}
                    className="text-lg font-semibold h-auto p-0 border-0 shadow-none focus-visible:ring-1 focus-visible:ring-ring"
                    autoFocus
                    disabled={isUpdatingTask}
                  />
                ) : (
                  <span
                    className={cn(
                      "min-w-0 break-words whitespace-normal cursor-pointer",
                      task.completed && "line-through text-muted-foreground"
                    )}
                    onClick={() => !task.completed && setIsEditingTitle(true)}
                  >
                    {task.title}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Created on {format(new Date(task.created_at), "MMM d, yyyy")}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {task.completed ? (
                <Button size="sm" variant="outline" onClick={handleToggleCompletion} className="h-8 border-green-500 bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Completed
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleToggleCompletion} className="h-8">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark complete
                </Button>
              )}
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
                  <DropdownMenuItem onSelect={() => { onDelete(task); onClose(); }} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 text-sm space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-500 scrollbar-track-transparent">
          {/* Task Details */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="flex items-start gap-3">
              <Briefcase className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Project</p>
                <Link to={`/projects/${task.project_slug}`} className="text-primary hover:underline">{task.project_name}</Link>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Status</p>
                <Select
                  value={task.status}
                  onValueChange={(newStatus: TaskStatus) => {
                    updateTaskStatusAndOrder({
                      taskId: task.id,
                      newStatus,
                      orderedTaskIds: [],
                      newTasks: [],
                      queryKey: ['tasks'],
                      movedColumns: false,
                    });
                  }}
                >
                  <SelectTrigger className="h-auto p-0 border-0 focus:ring-0 focus:ring-offset-0 w-auto bg-transparent shadow-none">
                    <SelectValue>
                      <Badge variant="outline" className={cn(getTaskStatusStyles(task.status).tw, 'border-transparent font-normal')}>
                        {task.status}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUS_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Flag className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Priority</p>
                <Badge className={getPriorityStyles(task.priority).tw}>{task.priority}</Badge>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Assignees</p>
                <div className="flex items-center -space-x-2 mt-1">
                  {task.assignedTo?.map((assignee: User) => {
                    const displayName = [assignee.first_name, assignee.last_name].filter(Boolean).join(' ').trim() || assignee.email?.split('@')[0] || 'Unknown User';
                    return (
                      <TooltipProvider key={assignee.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar className="h-6 w-6 border-2 border-background">
                              <AvatarImage src={getAvatarUrl(assignee.avatar_url, assignee.id)} />
                              <AvatarFallback style={generatePastelColor(assignee.id)}>
                                {getInitials([assignee.first_name, assignee.last_name].filter(Boolean).join(' '), assignee.email || undefined)}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{displayName}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            </div>
            {task.created_by && (
              <div className="flex items-start gap-3">
                <UserIcon className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">Task Creator</p>
                  <div className="flex items-center gap-2 mt-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={getAvatarUrl(task.created_by.avatar_url, task.created_by.id)} />
                            <AvatarFallback style={generatePastelColor(task.created_by.id)}>
                              {getInitials([task.created_by.first_name, task.created_by.last_name].filter(Boolean).join(' '), task.created_by.email || undefined)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{[task.created_by.first_name, task.created_by.last_name].filter(Boolean).join(' ').trim() || task.created_by.email?.split('@')[0] || 'Unknown User'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Due Date</p>
                <div className={cn("flex items-center gap-1.5", getDueDateClassName(task.due_date, task.completed))}>
                  <span>{task.due_date ? format(new Date(task.due_date), "MMM d, yyyy, p") : 'No due date'}</span>
                  {isOverdue(task.due_date) && !task.completed && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={handleSendReminder} disabled={isSendingReminder || !task.assignedTo || task.assignedTo.length === 0}>
                            {isSendingReminder ? <Loader2 className="h-3 w-3 animate-spin" /> : <BellRing className="h-3 w-3" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {(!task.assignedTo || task.assignedTo.length === 0) ? (
                            <p>No assignees to remind</p>
                          ) : (
                            <>
                              <p>Send reminder to assignees</p>
                              {task.last_reminder_sent_at && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Last sent: {formatDistanceToNow(new Date(task.last_reminder_sent_at), { addSuffix: true })}
                                </p>
                              )}
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>
            {allTags.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {allTags.map(tag => (
                      <Badge key={tag.id} variant="outline" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {description && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Description</h4>
              <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{formattedDescription}</ReactMarkdown>
              </div>
              {isLongDescription && (
                <Button variant="link" size="sm" onClick={() => setShowFullDescription(!showFullDescription)} className="px-0 h-auto">
                  {showFullDescription ? 'Show less' : 'Show more'}
                </Button>
              )}
            </div>
          )}

          {allAttachments.length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Attachments ({allAttachments.length})</h4>
              <TaskAttachmentList attachments={allAttachments} />
            </div>
          )}

          <div className="pt-4 border-t">
            <TaskCommentsList
              comments={comments}
              isLoading={isLoadingComments}
              onEdit={handleEditClick}
              onDelete={setCommentToDelete}
              onToggleReaction={handleToggleCommentReaction}
              editingCommentId={editingCommentId}
              editedText={editedText}
              setEditedText={setEditedText}
              handleSaveEdit={handleSaveEdit}
              handleCancelEdit={handleCancelEdit}
              newAttachments={newAttachments}
              removeNewAttachment={removeNewAttachment}
              handleEditFileChange={handleEditFileChange}
              editFileInputRef={editFileInputRef}
              onReply={handleReply}
              onCreateTicketFromComment={handleCreateTicketFromComment}
            />
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t">
          <CommentInput
            ref={commentInputRef}
            onAddCommentOrTicket={handleAddComment}
            allUsers={allUsers}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </div>
      </DrawerContent>
      <AlertDialog open={!!commentToDelete} onOpenChange={() => setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the comment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TaskDetailCard;