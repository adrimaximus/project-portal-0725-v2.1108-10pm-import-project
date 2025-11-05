import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task as ProjectTask, Comment as CommentType, User } from '@/types';
import { DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import TaskCommentsList from './TaskCommentsList';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCommentMutations } from '@/hooks/useCommentMutations';

interface TaskDetailCardProps {
  task: ProjectTask;
  onClose: () => void;
  onEdit: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
}

const TaskDetailCard: React.FC<TaskDetailCardProps> = ({ task, onClose, onEdit, onDelete }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const { toggleCommentReaction } = useCommentMutations(task.id);

  const { data: comments = [], isLoading: isLoadingComments } = useQuery<CommentType[]>({
    queryKey: ['task-comments', task.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_task_comments', { p_task_id: task.id });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!task.id,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase.from('comments').insert({
        project_id: task.project_id,
        task_id: task.id,
        author_id: user.id,
        text,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
      setNewCommentText('');
    },
    onError: (error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, text }: { commentId: string, text: string }) => {
      const { error } = await supabase.from('comments').update({ text }).eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
      setEditingCommentId(null);
      setEditedText('');
    },
    onError: (error) => {
      toast.error(`Failed to update comment: ${error.message}`);
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', task.id] });
    },
    onError: (error) => {
      toast.error(`Failed to delete comment: ${error.message}`);
    },
  });

  const handleAddComment = () => {
    if (newCommentText.trim()) {
      addCommentMutation.mutate(newCommentText);
    }
  };

  const handleEditComment = (comment: CommentType) => {
    setEditingCommentId(comment.id);
    setEditedText(comment.text || '');
  };

  const handleSaveEdit = () => {
    if (editingCommentId) {
      updateCommentMutation.mutate({ commentId: editingCommentId, text: editedText });
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedText('');
  };

  const handleDeleteComment = (comment: CommentType) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(comment.id);
    }
  };
  
  const handleReply = (userToReply: User) => {
    const authorName = [userToReply.first_name, userToReply.last_name].filter(Boolean).join(' ') || userToReply.email;
    const mention = `@\[${authorName}\](${userToReply.id}) `;
    setNewCommentText(prev => `${prev}${mention}`);
    commentInputRef.current?.focus();
  };

  const handleToggleReaction = (commentId: string, emoji: string) => {
    toggleCommentReaction({ commentId, emoji });
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <DrawerHeader>
        <DrawerTitle>{task.title}</DrawerTitle>
        <DrawerDescription>
          In project <span className="font-semibold">{task.project_name}</span>
        </DrawerDescription>
      </DrawerHeader>
      <div className="flex-1 overflow-y-auto px-4 md:px-6 space-y-6">
        <TaskCommentsList
          comments={comments}
          isLoading={isLoadingComments}
          onEdit={handleEditComment}
          onDelete={handleDeleteComment}
          onToggleReaction={handleToggleReaction}
          onReply={handleReply}
          editingCommentId={editingCommentId}
          editedText={editedText}
          setEditedText={setEditedText}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
          newAttachments={[]}
          removeNewAttachment={() => {}}
          handleEditFileChange={() => {}}
          editFileInputRef={React.createRef()}
        />
      </div>
      <div className="p-4 md:p-6 border-t">
        <div className="space-y-2">
          <Textarea
            ref={commentInputRef}
            placeholder="Add a comment... (use @ to mention someone)"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handleAddComment} disabled={addCommentMutation.isPending}>
              {addCommentMutation.isPending ? 'Commenting...' : 'Comment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailCard;