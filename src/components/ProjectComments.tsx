import React, { useState, useRef, useEffect } from 'react';
import { Project, Comment as CommentType, User } from "@/types";
import CommentInput from "./CommentInput";
import Comment from '../Comment';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ProjectCommentsProps {
  project: Project;
  comments: CommentType[];
  isLoadingComments: boolean;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => void;
  onDeleteComment: (comment: CommentType) => void;
  onToggleCommentReaction: (commentId: string, emoji: string) => void;
  editingCommentId: string | null;
  editedText: string;
  setEditedText: (text: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  onEdit: (comment: CommentType) => void;
  onReply: (comment: CommentType) => void;
  replyTo: CommentType | null;
  onCancelReply: () => void;
  onCreateTicketFromComment: (comment: CommentType) => void;
  newAttachments: File[];
  removeNewAttachment: (index: number) => void;
  handleEditFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  editFileInputRef: React.RefObject<HTMLInputElement>;
  initialMention?: { id: string; name: string } | null;
  onMentionConsumed: () => void;
  allUsers: User[];
}

const ProjectComments: React.FC<ProjectCommentsProps> = ({
  project,
  comments,
  isLoadingComments,
  onAddCommentOrTicket,
  onDeleteComment,
  onToggleCommentReaction,
  editingCommentId,
  editedText,
  setEditedText,
  handleSaveEdit,
  handleCancelEdit,
  onEdit,
  onReply,
  replyTo,
  onCancelReply,
  onCreateTicketFromComment,
  newAttachments,
  removeNewAttachment,
  handleEditFileChange,
  editFileInputRef,
  initialMention,
  onMentionConsumed,
  allUsers,
}) => {
  const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);
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

  const handleDeleteConfirm = () => {
    if (commentToDelete) {
      onDeleteComment(commentToDelete);
      setCommentToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] sm:min-h-[500px]">
      <div className="flex-shrink-0 pb-4 border-b mb-4">
        <CommentInput
          ref={commentInputRef}
          onAddCommentOrTicket={onAddCommentOrTicket}
          allUsers={allUsers}
          replyTo={replyTo}
          onCancelReply={onCancelReply}
        />
      </div>
      <div className="flex-1 overflow-y-auto pr-4 space-y-4">
        {isLoadingComments ? (
          <p>Loading comments...</p>
        ) : comments.length > 0 ? (
          [...comments].reverse().map((comment: CommentType) => (
            <Comment
              key={comment.id}
              comment={comment}
              isEditing={editingCommentId === comment.id}
              editedText={editedText}
              setEditedText={setEditedText}
              handleSaveEdit={handleSaveEdit}
              handleCancelEdit={handleCancelEdit}
              onEdit={onEdit}
              onDelete={onDeleteComment}
              onToggleReaction={onToggleCommentReaction}
              onReply={onReply}
              onCreateTicketFromComment={onCreateTicketFromComment}
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