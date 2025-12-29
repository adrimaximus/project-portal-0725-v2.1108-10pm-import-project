import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Project, Comment as CommentType, User } from "@/types";
import CommentInput, { CommentInputHandle } from "../CommentInput";
import Comment from '../Comment';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from '../ui/scroll-area';

interface ProjectCommentsProps {
  project: Project;
  comments: CommentType[];
  isLoadingComments: boolean;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[], replyToId?: string | null) => void;
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
  onGoToReply: (messageId: string) => void;
  highlightedCommentId?: string | null;
  onHighlightComplete?: () => void;
  storageKey: string;
}

const ProjectComments = forwardRef<CommentInputHandle, ProjectCommentsProps>(({
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
  onGoToReply,
  highlightedCommentId,
  onHighlightComplete,
  storageKey,
}, ref) => {
  const [commentToDelete, setCommentToDelete] = useState<CommentType | null>(null);
  const lastProcessedMentionId = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMention && ref && 'current' in ref && ref.current) {
      lastProcessedMentionId.current = initialMention.id;
      const mentionText = `@[${initialMention.name}](${initialMention.id}) `;
      ref.current.setText(mentionText, true);
      ref.current.focus();
      onMentionConsumed();
    }
  }, [initialMention, onMentionConsumed, ref]);

  useEffect(() => {
    if (highlightedCommentId) {
      const element = document.getElementById(`message-${highlightedCommentId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-primary/10', 'rounded-md');
        const timer = setTimeout(() => {
          element.classList.remove('bg-primary/10', 'rounded-md');
          if (onHighlightComplete) {
            onHighlightComplete();
          }
        }, 2500);
        return () => clearTimeout(timer);
      }
    } else {
        // Auto-scroll to bottom on load if no highlight
        if (messagesEndRef.current && !isLoadingComments) {
            // Use a small timeout to ensure rendering is complete
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }
  }, [highlightedCommentId, onHighlightComplete, isLoadingComments, comments.length]);

  const handleDeleteConfirm = () => {
    if (commentToDelete) {
      onDeleteComment(commentToDelete);
      setCommentToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-background">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
            {isLoadingComments ? (
            <p className="text-center text-muted-foreground py-10">Loading discussion...</p>
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
                    onEdit={onEdit}
                    onDelete={setCommentToDelete}
                    onToggleReaction={onToggleCommentReaction}
                    onReply={onReply}
                    onCreateTicketFromComment={onCreateTicketFromComment}
                    newAttachments={newAttachments}
                    removeNewAttachment={removeNewAttachment}
                    handleEditFileChange={handleEditFileChange}
                    editFileInputRef={editFileInputRef}
                    onGoToReply={onGoToReply}
                    allUsers={allUsers}
                />
            ))
            ) : (
            <div className="text-center py-20 text-muted-foreground">
                <p>No comments yet.</p>
                <p className="text-sm">Start the conversation below!</p>
            </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="flex-shrink-0 p-4 border-t bg-muted/10">
        <CommentInput
          ref={ref}
          onAddCommentOrTicket={onAddCommentOrTicket}
          allUsers={allUsers}
          replyTo={replyTo}
          onCancelReply={onCancelReply}
          storageKey={storageKey}
          dropUp={true} 
          placeholder="Type your message... (@ to mention)"
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
});

export default ProjectComments;