import React, { useEffect } from 'react';
import { Comment as CommentType, User } from '@/types';
import Comment from '../Comment';

interface TaskCommentsListProps {
  comments: CommentType[];
  isLoading: boolean;
  onEdit: (comment: CommentType) => void;
  onDelete: (comment: CommentType) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
  editingCommentId: string | null;
  editedText: string;
  setEditedText: (text: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  newAttachments: File[];
  removeNewAttachment: (index: number) => void;
  handleEditFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  editFileInputRef: React.RefObject<HTMLInputElement>;
  onReply: (comment: CommentType) => void;
  onCreateTicketFromComment: (comment: CommentType) => void;
  onGoToReply: (messageId: string) => void;
  allUsers: User[];
  highlightedCommentId?: string | null;
  onHighlightComplete?: () => void;
}

const TaskCommentsList: React.FC<TaskCommentsListProps> = (props) => {
  const { comments, isLoading, onGoToReply, allUsers, highlightedCommentId, onHighlightComplete, ...rest } = props;

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
    }
  }, [highlightedCommentId, onHighlightComplete]);

  if (isLoading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      {[...comments].reverse().map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          isEditing={props.editingCommentId === comment.id}
          onGoToReply={onGoToReply}
          allUsers={allUsers}
          {...rest}
        />
      ))}
    </div>
  );
};

export default TaskCommentsList;