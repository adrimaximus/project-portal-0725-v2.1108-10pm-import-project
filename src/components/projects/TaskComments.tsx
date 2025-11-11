import React, { useState, useRef } from 'react';
import { useCommentManager } from '@/hooks/useCommentManager';
import { Comment as CommentType, User, Task } from '@/types';
import CommentInput, { CommentInputHandle } from '../CommentInput';
import TaskCommentsList from './TaskCommentsList';
import { useProfiles } from '@/hooks/useProfiles';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTaskModal } from '@/contexts/TaskModalContext';
import { supabase } from '@/integrations/supabase/client';

interface TaskCommentsProps {
  taskId: string;
  projectId: string;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, projectId }) => {
  const { 
    comments, 
    isLoadingComments, 
    addComment, 
    updateComment, 
    deleteComment, 
    toggleReaction 
  } = useCommentManager({ scope: { taskId, projectId } });

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [replyTo, setReplyTo] = useState<CommentType | null>(null);
  const { data: allUsers = [] } = useProfiles();
  const commentInputRef = useRef<{ setText: (text: string, append?: boolean) => void, focus: () => void }>(null);
  const { onOpen: onOpenTaskModal } = useTaskModal();

  const pollForTask = (commentId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('id, project_id')
        .eq('origin_ticket_id', commentId)
        .single();
      
      if (taskData) {
        clearInterval(interval);
        const { data: fullTaskData, error: fullTaskError } = await supabase
          .rpc('get_project_tasks', { p_project_ids: [taskData.project_id] })
          .eq('id', taskData.id)
          .single();
        
        if (fullTaskData && !fullTaskError) {
          onOpenTaskModal(fullTaskData as Task, undefined, undefined);
        } else {
          toast.error("Could not open the new task for editing.");
        }
      } else if (attempts > 10) { // Timeout after ~5 seconds
        clearInterval(interval);
        toast.error("Could not find the created task. It may appear shortly.");
      }
    }, 500);
  };

  const handleAddComment = (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => {
    addComment.mutate({ text, isTicket, attachments, replyToId: replyTo?.id }, {
      onSuccess: (result) => {
        if (result.isTicket) {
          toast.info("Ticket created. Finding associated task...");
          pollForTask(result.data.id);
        }
      }
    });
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
        toast.info("Comment converted to ticket. Finding associated task...");
        pollForTask(comment.id);
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

  return (
    <div className="space-y-6">
      <TaskCommentsList
        comments={comments}
        isLoading={isLoadingComments}
        onEdit={handleEditClick}
        onDelete={setCommentToDelete}
        onToggleReaction={(commentId, emoji) => toggleReaction.mutate({ commentId, emoji })}
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
        allUsers={allUsers}
      />
      <div className="pt-4 border-t">
        <CommentInput
          ref={commentInputRef}
          onAddCommentOrTicket={handleAddComment}
          allUsers={allUsers}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>
      <AlertDialog open={!!commentToDelete} onOpenChange={() => setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the comment. If this is a ticket, the associated task will also be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskComments;