import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const fetchTags = async (userId: string | undefined): Promise<Tag[]> => {
  if (!userId) return [];
  // RLS will handle filtering to user's own tags + global (NULL user_id) tags
  const { data, error } = await supabase.from('tags').select('*');
  if (error) throw new Error(error.message);
  return data;
};

export const useTags = () => {
  const { user } = useAuth();
  return useQuery<Tag[], Error>({
    queryKey: ['tags', user?.id],
    queryFn: () => fetchTags(user?.id),
    enabled: !!user,
  });
};