import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types/goal';

const fetchTags = async (): Promise<Tag[]> => {
  const { data, error } = await supabase.from('tags').select('*');
  if (error) throw new Error(error.message);
  return data;
};

export const useTags = () => {
  return useQuery<Tag[], Error>({
    queryKey: ['tags'],
    queryFn: fetchTags,
  });
};