import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Comment as CommentType, Reaction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/utils';

export const useCommentMutations = (taskId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = ['task-comments', taskId];

  const { mutate: toggleCommentReaction } = useMutation<
    void,
    Error,
    { commentId: string; emoji: string },
    { previousComments: CommentType[] | undefined }
  >({
    mutationFn: async ({ commentId, emoji }) => {
      const { error } = await supabase.rpc('toggle_comment_reaction', { p_comment_id: commentId, p_emoji: emoji });
      if (error) throw error;
    },
    onMutate: async ({ commentId, emoji }) => {
      if (!user) return;

      await queryClient.cancelQueries({ queryKey });
      const previousComments = queryClient.getQueryData<CommentType[]>(queryKey);

      queryClient.setQueryData<CommentType[]>(queryKey, (oldComments = []) => {
        return oldComments.map(comment => {
          if (comment.id === commentId) {
            const newReactions: Reaction[] = [...(comment.reactions || [])];
            const existingReactionIndex = newReactions.findIndex(r => r.user_id === user.id);

            if (existingReactionIndex > -1) {
              if (newReactions[existingReactionIndex].emoji === emoji) {
                newReactions.splice(existingReactionIndex, 1);
              } else {
                newReactions[existingReactionIndex] = { ...newReactions[existingReactionIndex], emoji };
              }
            } else {
              newReactions.push({
                id: `temp-${Date.now()}`,
                emoji,
                user_id: user.id,
                user_name: user.name || 'You',
              });
            }
            return { ...comment, reactions: newReactions };
          }
          return comment;
        });
      });

      return { previousComments };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(queryKey, context.previousComments);
      }
      toast.error("Failed to update reaction.", { description: getErrorMessage(err) });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return { toggleCommentReaction };
};