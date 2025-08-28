import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/user';

const fetchProfiles = async (): Promise<Profile[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw new Error(error.message);
  return data;
};

export const useProfiles = () => {
  return useQuery<Profile[], Error>({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });
};