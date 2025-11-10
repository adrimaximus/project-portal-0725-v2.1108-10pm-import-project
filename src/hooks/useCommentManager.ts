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
      if (scope.taskId) {
        const { data, error } = await supabase.rpc('get_task_comments', { p_task_id: scope.taskId });
        if (error) throw error;
        return (data as any[]).map(c => ({ ...c, isTicket: c.is_ticket })) as CommentType[];
      }
      if (scope.projectId) {
        const { data, error } = await supabase.rpc('get_project_comments', { p_project_id: scope.projectId });
        if (error) throw error;
        return (data as any[]).map(c => ({ ...c, isTicket: c.is_ticket })) as CommentType[];
      }
      return [];
    },
    enabled: !!(scope.projectId || scope.taskId),
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ text, isTicket, attachments, mentionedUserIds, replyToId }: { text: string, isTicket: boolean, attachments: File[] | null, mentionedUserIds: string[], replyToId?: string | null }) => {
      if (!user) throw new Error("User not authenticated");

      let projectId = scope.projectId;

      // If we have a taskId but no projectId, fetch it from the task.
      if (scope.taskId && !scope.projectId) {
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('project_id')
          .eq('id', scope.taskId)
          .single();
        if (taskError) throw new Error(`Could not find project for task: ${taskError.message}`);
        if (taskData) {
          projectId = taskData.project_id;
        } else {
          throw new Error(`Task with id ${scope.taskId} not found.`);
        }
      }

      if (!projectId) {
        throw new Error("Project ID is missing for this comment.");
      }

      let attachmentsJsonb: any[] = [];
      if (attachments && attachments.length > 0) {
        const uploadPromises = attachments.map(async (file) => {
          const fileId = uuidv4();
          const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const filePath = `${projectId}/comments/${Date.now()}-${sanitizedFileName}`;
          const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
          if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
          if (!urlData || !urlData.publicUrl) throw new Error(`Failed to get public URL for uploaded file ${file.name}.`);
          return { id: fileId, file_name: file.name, file_url: urlData.publicUrl, file_type: file.type, file_size: file.size, storage_path: filePath, created_at: new Date().toISOString() };
        });
        attachmentsJsonb = await Promise.all(uploadPromises);
      }
      
      if (isTicket) {
        const { data: taskId, error } = await supabase.rpc('create_ticket_and_assign_mentions', {
          p_project_id: projectId,
          p_author_id: user.id,
          p_comment_text: text,
          p_attachments: attachmentsJsonb,
          p_mentioned_user_ids: mentionedUserIds,
          p_reply_to_id: replyToId,
        });
        if (error) throw error;
        return { isTicket: true, taskId };
      } else {
        const { data, error } = await supabase.from('comments').insert({ 
          project_id: projectId, 
          task_id: scope.taskId, 
          author_id: user.id, 
          text, 
          is_ticket: false, 
          attachments_jsonb: attachmentsJsonb,
          reply_to_comment_id: replyToId,
        }).select().single();
        if (error) throw error;
        return { isTicket: false, data };
      }
    },
    onSuccess: ({ isTicket }) => {
      toast.success(isTicket ? "Ticket created and assigned." : "Comment added.");
      queryClient.invalidateQueries({ queryKey });
      if (isTicket) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['project', scope.projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
    },
    onError: (error: any) => toast.error("Failed to add comment.", { description: getErrorMessage(error) }),
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, text, isTicket, attachments }: { commentId: string, text: string, isTicket?: boolean, attachments?: File[] | null }) => {
      const { data: originalComment, error: fetchError } = await supabase.from('comments').select('attachments_jsonb, project_id').eq('id', commentId).single();
      if (fetchError) throw fetchError;

      let attachmentsJsonb: any[] = originalComment.attachments_jsonb || [];
      if (attachments && attachments.length > 0) {
        const uploadPromises = attachments.map(async (file) => {
          const fileId = uuidv4();
          const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const filePath = `${originalComment.project_id}/comments/${Date.now()}-${sanitizedFileName}`;
          const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
          if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
          if (!urlData || !urlData.publicUrl) throw new Error(`Failed to get public URL for uploaded file ${file.name}.`);
          return { id: fileId, file_name: file.name, file_url: urlData.publicUrl, file_type: file.type, file_size: file.size, storage_path: filePath, created_at: new Date().toISOString() };
        });
        const newAttachmentsJsonb = await Promise.all(uploadPromises);
        attachmentsJsonb = [...attachmentsJsonb, ...newAttachmentsJsonb];
      }
      const updatePayload: { text: string, is_ticket?: boolean, attachments_jsonb?: any[] } = { text, attachments_jsonb: attachmentsJsonb };
      if (isTicket !== undefined) {
        updatePayload.is_ticket = isTicket;
      }
      const { error } = await supabase.from('comments').update(updatePayload).eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      if (!variables.isTicket) {
        toast.success("Comment updated.");
      }
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