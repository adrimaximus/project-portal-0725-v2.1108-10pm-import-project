import React, { useState, useRef, useEffect } from 'react';
import { Project, Comment as CommentType, User } from "@/types";
import CommentInput from "../CommentInput";
import Comment from '../Comment';
import { useCommentManager } from '@/hooks/useCommentManager';
import { toast } from 'sonner';

interface ProjectCommentsProps {
  project: Project;
  initialMention?: { id: string; name: string } | null;
  onMentionConsumed: () => void;
  allUsers: User[];
}

const ProjectComments: React.FC<ProjectCommentsProps> = ({
  project,
  initialMention,
  onMentionConsumed,
  allUsers,
}) => {
  const { 
    comments, 
    isLoadingComments,
    addComment, 
    updateComment,
  } = useCommentManager({ scope: { projectId: project.id } });

  const [replyTo, setReplyTo] = useState<CommentType | null>(null);
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

  const handleAddCommentOrTicket = (text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[]) => {
    addComment.mutate({ text, isTicket, attachments, mentionedUserIds, replyToId: replyTo?.id }, {
      onSuccess: () => {
        setReplyTo(null);
      }
    });
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

  const handleCreateTicketFromComment = (comment: CommentType) => {
    updateComment.mutate({ commentId: comment.id, text: comment.text || '', isTicket: true }, {
      onSuccess: () => {
        toast.info("Comment converted to ticket. Finding associated task...");
        // The polling logic is now handled within the mutation's onSuccess in the parent component
      }
    });
  };

  const handleScrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-primary/10', 'rounded-md');
      setTimeout(() => {
        element.classList.remove('bg-primary/10', 'rounded-md');
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] sm:min-h-[500px]">
      <div className="flex-shrink-0 pb-4 border-b mb-4">
        <CommentInput
          ref={commentInputRef}
          onAddCommentOrTicket={handleAddCommentOrTicket}
          allUsers={allUsers}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
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
              onReply={handleReply}
              onCreateTicketFromComment={handleCreateTicketFromComment}
              onGoToReply={handleScrollToMessage}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center pt-10">No comments yet. Start the discussion!</p>
        )}
      </div>
    </div>
  );
};

export default ProjectComments;