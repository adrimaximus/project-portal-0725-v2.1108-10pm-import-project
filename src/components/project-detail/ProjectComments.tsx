import { useState, useRef, useEffect } from 'react';
import { Project, Comment as CommentType, User } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import CommentInput from "../CommentInput";
import Comment from '../Comment';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCommentManager } from '@/hooks/useCommentManager';
import { useProfiles } from '@/hooks/useProfiles';

interface ProjectCommentsProps {
  project: Project;
  initialMention?: { id: string; name: string } | null;
  onMentionConsumed: () => void;
  replyTo: CommentType | null;
  onReply: (comment: CommentType) => void;
  onCancelReply: () => void;
  onCreateTicketFromComment: (comment: CommentType) => void;
}

const ProjectComments = ({ 
  project, 
  initialMention, 
  onMentionConsumed, 
  replyTo,
  onReply,
  onCancelReply,
  onCreateTicketFromComment,
}: ProjectCommentsProps) => {
  const { user } = useAuth();
  const { data: allUsers = [] } = useProfiles();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<{ setText: (text: string, append?: boolean) => void, focus: () => void }>(null);
  const lastProcessedMentionId = useRef<string | null>(null);

  const { 
    comments, 
    isLoadingComments, 
    addComment, 
    updateComment, 
    deleteComment, 
    toggleReaction 
  } = useCommentManager({ scope: { projectId: project.id } });

  useEffect(() => {
    if (initialMention && commentInputRef.current && initialMention.id !== lastProcessedMentionId.current) {
      lastProcessedMentionId.current = initialMention.id;
      const mentionText = `@[${initialMention.name}](${initialMention.id}) `;
      commentInputRef.current.setText(mentionText, true);
      commentInputRef.current.focus();
      onMentionConsumed();
    }
  }, [initialMention, onMentionConsumed]);

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

  const handleCreateTicket = (comment: CommentType) => {
    updateComment.mutate({ commentId: comment.id, text: comment.text || '', isTicket: true }, {
      onSuccess: () => {
        onCreateTicketFromComment(comment);
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
    <div className="flex flex-col h-full min-h-[400px] sm:min-h-[500px]">
      <div className="flex-shrink-0 pb-4 border-b mb-4">
        <CommentInput
          ref={commentInputRef}
          project={project}
          onAddCommentOrTicket={(text, isTicket, attachments, mentionedUserIds) => addComment.mutate({ text, isTicket, attachments, replyToId: replyTo?.id })}
          allUsers={allUsers}
          replyTo={replyTo}
          onCancelReply={onCancelReply}
        />
      </div>
      <div className="flex-1 overflow-y-auto pr-4 space-y-4">
        {isLoadingComments ? (
          <p>Loading comments...</p>
        ) : comments.length > 0 ? (
          comments.map((comment: CommentType) => (
            <Comment
              key={comment.id}
              comment={comment}
              isEditing={editingCommentId === comment.id}
              editedText={editedText}
              setEditedText={setEditedText}
              handleSaveEdit={handleSaveEdit}
              handleCancelEdit={handleCancelEdit}
              onEdit={handleEditClick}
              onDelete={setCommentToDelete}
              onToggleReaction={toggleReaction.mutate}
              onReply={onReply}
              onCreateTicketFromComment={handleCreateTicket}
              newAttachments={newAttachments}
              removeNewAttachment={removeNewAttachment}
              handleEditFileChange={handleEditFileChange}
              editFileInputRef={editFileInputRef}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center pt-10">No comments yet. Start the discussion!</p>
        )}
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

export default ProjectComments;