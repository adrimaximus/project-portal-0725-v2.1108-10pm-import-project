import React from 'react';
import { Comment as CommentType } from '@/types';
import Comment from '../Comment';

interface TaskCommentsListProps {
  comments: CommentType[];
  isLoading: boolean;
  onReply: (comment: CommentType) => void;
  onGoToReply: (messageId: string) => void;
}

const TaskCommentsList: React.FC<TaskCommentsListProps> = (props) => {
  const { comments, isLoading, onReply, onGoToReply } = props;

  if (isLoading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      {[...comments].reverse().map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          onReply={onReply}
          onGoToReply={onGoToReply}
          onCreateTicketFromComment={() => {}} // This is handled in the parent for now
        />
      ))}
    </div>
  );
};

export default TaskCommentsList;