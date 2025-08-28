import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tag } from '@/types/goal';

export const useTagMutations = () => {
  const queryClient = useQueryClient();

  const createTagMutation = useMutation({
    mutationFn: async (tagData: { name: string; color: string }): Promise<Tag> => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('tags')
        .insert({ ...tagData, user_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Tag created successfully!');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error) => {
      toast.error('Failed to create tag', { description: error.message });
    },
  });

  return {
    createTag: createTagMutation.mutateAsync,
    isCreatingTag: createTagMutation.isPending,
  };
};