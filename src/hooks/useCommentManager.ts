import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Comment as CommentType, User, Reaction } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

interface UseCommentManagerProps {
  scope: { projectId?: string; taskId?: string };
}

export const useCommentManager = ({ scope }: UseCommentManagerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['comments', scope];

  const { data: comments = [], isLoading: isLoadingComments } = useQuery<CommentType[]>({
    queryKey,
    queryFn: async () => {
      let query = supabase.from('comments').select('*, author:profiles(*), reactions:comment_reactions(*, user:profiles(id, first_name, last_name, email))');
      if (scope.projectId) {
        query = query.eq('project_id', scope.projectId).is('task_id', null);
      } else if (scope.taskId) {
        query = query.eq('task_id', scope.taskId);
      } else {
        return [];
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;
      
      return (data as any[]).map(c => ({
        ...c,
        author: c.author || { id: 'unknown', name: 'Unknown User' },
        reactions: (c.reactions || []).map((r: any) => ({
          id: r.id,
          emoji: r.emoji,
          user_id: r.user_id,
          user_name: r.user ? `${r.user.first_name || ''} ${r.user.last_name || ''}`.trim() || r.user.email : 'A user',
        }))
      })) as CommentType[];
    },
    enabled: !!(scope.projectId || scope.taskId),
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ text, isTicket, attachments, replyToId }: { text: string, isTicket: boolean, attachments: File[] | null, replyToId?: string | null }) => {
      if (!user) throw new Error("User not authenticated");
      let attachmentsJsonb: any[] = [];
      if (attachments && attachments.length > 0) {
        const uploadPromises = attachments.map(async (file) => {
          const fileId = uuidv4();
          const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const filePath = `${scope.projectId || 'tasks'}/comments/${Date.now()}-${sanitizedFileName}`;
          const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
          if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
          if (!urlData || !urlData.publicUrl) throw new Error(`Failed to get public URL for uploaded file ${file.name}.`);
          return { id: fileId, file_name: file.name, file_url: urlData.publicUrl, file_type: file.type, file_size: file.size, storage_path: filePath, created_at: new Date().toISOString() };
        });
        attachmentsJsonb = await Promise.all(uploadPromises);
      }
      const { data, error } = await supabase.from('comments').insert({ 
        project_id: scope.projectId, 
        task_id: scope.taskId, 
        author_id: user.id, 
        text, 
        is_ticket: isTicket, 
        attachments_jsonb: attachmentsJsonb,
        reply_to_comment_id: replyToId,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Comment added.");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => toast.error("Failed to add comment.", { description: getErrorMessage(error) }),
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, text, isTicket }: { commentId: string, text: string, isTicket?: boolean }) => {
      const updatePayload: { text: string, is_ticket?: boolean } = { text };
      if (isTicket !== undefined) {
        updatePayload.is_ticket = isTicket;
      }
      const { error } = await supabase.from('comments').update(updatePayload).eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment updated.");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => toast.error("Failed to update comment.", { description: getErrorMessage(error) }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.rpc('delete_comment_and_task', { p_comment_id: commentId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comment deleted.");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => toast.error("Failed to delete comment.", { description: getErrorMessage(error) }),
  });

  const toggleReactionMutation = useMutation({
    mutationFn: async ({ commentId, emoji }: { commentId: string, emoji: string }) => {
      const { error } = await supabase.rpc('toggle_comment_reaction', { p_comment_id: commentId, p_emoji: emoji });
      if (error) throw error;
    },
    onMutate: async ({ commentId, emoji }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousComments = queryClient.getQueryData<CommentType[]>(queryKey);
      if (previousComments && user) {
        const newComments = previousComments.map(comment => {
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
              newReactions.push({ id: `temp-${Date.now()}`, emoji, user_id: user.id, user_name: user.name || 'You' });
            }
            return { ...comment, reactions: newReactions };
          }
          return comment;
        });
        queryClient.setQueryData(queryKey, newComments);
      }
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

  return {
    comments,
    isLoadingComments,
    addComment: addCommentMutation,
    updateComment: updateCommentMutation,
    deleteComment: deleteCommentMutation,
    toggleReaction: toggleReactionMutation,
  };
};