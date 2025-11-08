import { useState, useRef, useEffect } from 'react';
import { Project, Comment as CommentType, User } from "@/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import CommentInput from "../CommentInput";
import Comment from '../Comment';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ProjectCommentsProps {
  project: Project;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[], replyToId?: string | null) => void;
  onUpdateComment: (project: Project, commentId: string, text: string, attachments: File[] | null, isConvertingToTicket: boolean, mentionedUserIds: string[]) => void;
  onDeleteComment: (commentId: string) => void;
  onToggleCommentReaction: (commentId: string, emoji: string) => void;
  isUpdatingComment?: boolean;
  updatedCommentId?: string;
  initialMention?: { id: string; name: string } | null;
  onMentionConsumed: () => void;
  allUsers: User[];
  replyTo: CommentType | null;
  onReply: (comment: CommentType) => void;
  onCancelReply: () => void;
  onCreateTicketFromComment: (comment: CommentType) => void;
}

const ProjectComments = ({ 
  project, 
  onAddCommentOrTicket, 
  onUpdateComment, 
  onDeleteComment, 
  onToggleCommentReaction, 
  initialMention, 
  onMentionConsumed, 
  allUsers,
  replyTo,
  onReply,
  onCancelReply,
  onCreateTicketFromComment,
}: ProjectCommentsProps) => {
  const { user } = useAuth();
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [isConvertingToTicket, setIsConvertingToTicket] = useState(false);
  const commentInputRef = useRef<{ setText: (text: string, append?: boolean) => void, focus: () => void }>(null);
  const lastProcessedMentionId = useRef<string | null>(null);

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
    const textWithoutAttachments = comment.text?.replace(/\n\n\*\*Attachments:\*\*[\s\S]*$/, '').trim() || '';
    setEditingCommentId(comment.id);
    setEditedText(textWithoutAttachments);
    setNewAttachments([]);
    setIsConvertingToTicket(comment.is_ticket);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedText('');
    setNewAttachments([]);
    setIsConvertingToTicket(false);
  };

  const handleSaveEdit = () => {
    if (editingCommentId) {
      const mentionedUserIds: string[] = []; // Placeholder for now
      onUpdateComment(project, editingCommentId, editedText, newAttachments, isConvertingToTicket, mentionedUserIds);
    }
    handleCancelEdit();
  };

  const handleDeleteConfirm = () => {
    if (commentToDelete) {
      onDeleteComment(commentToDelete.id);
      setCommentToDelete(null);
    }
  };

  const comments = (project.comments || []);

  return (
    <div className="flex flex-col h-full min-h-[400px] sm:min-h-[500px]">
      <div className="flex-shrink-0 pb-4 border-b mb-4">
        <CommentInput
          ref={commentInputRef}
          project={project}
          onAddCommentOrTicket={onAddCommentOrTicket}
          allUsers={allUsers}
          replyTo={replyTo}
          onCancelReply={onCancelReply}
        />
      </div>
      <div className="flex-1 overflow-y-auto pr-4 space-y-4">
        {comments.length > 0 ? (
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
              onToggleReaction={onToggleCommentReaction}
              onReply={onReply}
              onCreateTicketFromComment={onCreateTicketFromComment}
              newAttachments={newAttachments}
              removeNewAttachment={() => {}}
              handleEditFileChange={() => {}}
              editFileInputRef={useRef(null)}
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