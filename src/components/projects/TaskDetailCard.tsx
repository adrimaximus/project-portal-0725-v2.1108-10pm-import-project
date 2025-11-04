import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Task, TaskAttachment, Reaction, User, Comment as CommentType } from '@/types';
import { DrawerContent } from '@/components/ui/drawer';
import { Button } from '../ui/button';
import { format, isPast } from 'date-fns';
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
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import CommentInput from '../CommentInput';
import { useProfiles } from '@/hooks/useProfiles';
import { useCommentMutations } from '@/hooks/useCommentMutations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

interface TaskDetailCardProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
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
        id: task.origin_ticket_id || `legacy-${task.id}`,
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
  const { user } = useAuth();
  const { toggleTaskReaction, sendReminder } = useTaskMutations();
  const { toggleCommentReaction } = useCommentMutations(task.id);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const { data: allUsers = [] } = useProfiles();

  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['task-comments', task.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_task_comments', { p_task_id: task.id });
      if (error) throw error;
      return (data as any[]).map(c => ({ ...c, isTicket: c.is_ticket })) as CommentType[];
    },
    enabled: !!task.id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ text, attachments, mentionedUserIds }: { text: string, attachments: File[] | null, mentionedUserIds: string[] }) => {
      if (!user) throw new Error("User not authenticated");
      let attachmentsJsonb: any[] = [];
      if (attachments && attachments.length > 0) {
        const uploadPromises = attachments.map(async (file) => {
          const fileId = uuidv4();
          const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const filePath = `${task.project_id}/comments/${Date.now()}-${sanitizedFileName}`;
          const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
          if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
          if (!urlData || !urlData.publicUrl) throw new Error(`Failed to get public URL for uploaded file ${file.name}.`);
          return { id: fileId, file_name: file.name, file_url: urlData.publicUrl, file_type: file.type, file_size: file.size, storage_path: filePath, created_at: new Date().toISOString() };
        });
        attachmentsJsonb = await Promise.all(uploadPromises);
      }
      const { error } = await supabase.from('comments').insert({ project_id: task.project_id, task_id: task.id, author_id: user.id, text, is_ticket: false, attachments_jsonb: attachmentsJsonb });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment added.");
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
    },
    onError: (error: any) => toast.error("Failed to add comment.", { description: error.message }),
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, text, attachments }: { commentId: string, text: string, attachments: File[] | null }) => {
      const { data: originalComment, error: fetchError } = await supabase.from('comments').select('attachments_jsonb, project_id').eq('id', commentId).single();
      if (fetchError) throw fetchError;
      let attachmentsJsonb: any[] = originalComment.attachments_jsonb || [];
      if (attachments && attachments.length > 0) {
        const uploadPromises = attachments.map(async (file) => {
          const fileId = uuidv4();
          const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const filePath = `${originalComment.project_id}/comments/${Date.now()}-${sanitizedFileName}`;
          const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
          if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
          if (!urlData || !urlData.publicUrl) throw new Error(`Failed to get public URL for uploaded file ${file.name}.`);
          return { id: fileId, file_name: file.name, file_url: urlData.publicUrl, file_type: file.type, file_size: file.size, storage_path: filePath, created_at: new Date().toISOString() };
        });
        const newAttachmentsJsonb = await Promise.all(uploadPromises);
        attachmentsJsonb = [...attachmentsJsonb, ...newAttachmentsJsonb];
      }
      const { error } = await supabase.from('comments').update({ text, attachments_jsonb: attachmentsJsonb }).eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment updated.");
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
    },
    onError: (error: any) => toast.error("Failed to update comment.", { description: error.message }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment deleted.");
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
    },
    onError: (error: any) => toast.error("Failed to delete comment.", { description: error.message }),
  });

  const handleAddComment = (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => {
    addCommentMutation.mutate({ text, attachments, mentionedUserIds });
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
      updateCommentMutation.mutate({ commentId: editingCommentId, text: editedText, attachments: newAttachments });
    }
    handleCancelEdit();
  };

  const handleDeleteConfirm = () => {
    if (commentToDelete) {
      deleteCommentMutation.mutate(commentToDelete.id);
      setCommentToDelete(null);
    }
  };

  const handleToggleCommentReaction = (commentId: string, emoji: string) => {
    toggleCommentReaction({ commentId, emoji });
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
      const hasTicketTag = tags.some(t => t.name.toLowerCase() === 'ticket');
      if (!hasTicketTag) {
        tags.push({ id: 'ticket-tag', name: 'Ticket', color: '#8B5CF6', user_id: task.created_by.id });
      }
    }
    return tags;
  }, [task?.tags, task?.origin_ticket_id, task?.created_by.id]);

  const description = task.description || '';
  const isLongDescription = description.length > 500;
  const displayedDescription = isLongDescription && !showFullDescription ? `${description.substring(0, 500)}...` : description;

  const handleToggleReaction = (emoji: string) => {
    toggleTaskReaction({ taskId: task.id, emoji });
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

        <div className="flex-1 overflow-y-auto p-4 text-sm space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-500 scrollbar-track-transparent">
          {/* Task Details */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {/* ... other details ... */}
          </div>
          {/* ... other sections ... */}
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
          />
        </div>

        <div className="flex-shrink-0 p-4 border-t">
          <CommentInput
            project={task as any}
            onAddCommentOrTicket={handleAddComment}
            allUsers={allUsers}
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