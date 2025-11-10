import React from 'react';
import { Comment as CommentType } from '@/types';
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
}

const TaskCommentsList: React.FC<TaskCommentsListProps> = (props) => {
  const { comments, isLoading, onGoToReply, ...rest } = props;

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
          {...rest}
        />
      ))}
    </div>
  );
};

export default TaskCommentsList;