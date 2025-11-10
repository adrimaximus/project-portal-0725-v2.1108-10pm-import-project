import React, { useState, useRef } from 'react';
import { useCommentManager } from '@/hooks/useCommentManager';
import { Comment as CommentType, User, Task } from '@/types';
import CommentInput from '../CommentInput';
import TaskCommentsList from './TaskCommentsList';
import { useProfiles } from '@/hooks/useProfiles';
import { toast } from 'sonner';
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
  } = useCommentManager({ scope: { taskId, projectId } });

  const [replyTo, setReplyTo] = useState<CommentType | null>(null);
  const commentInputRef = useRef<{ setText: (text: string, append?: boolean) => void, focus: () => void }>(null);
  const { data: allUsers = [] } = useProfiles();
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
    <div className="space-y-6">
      <TaskCommentsList
        comments={comments}
        isLoading={isLoadingComments}
        onReply={handleReply}
        onGoToReply={handleScrollToMessage}
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
    </div>
  );
};

export default TaskComments;