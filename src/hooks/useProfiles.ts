import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { getInitials, getAvatarUrl } from '@/lib/utils';

const fetchProfiles = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw new Error(error.message);
  return data.map(profile => {
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return {
      id: profile.id,
      name: fullName || profile.email || 'No name',
      email: profile.email,
      avatar_url: getAvatarUrl(profile.avatar_url, profile.id),
      role: profile.role,
      status: profile.status,
      initials: getInitials(fullName, profile.email) || 'NN',
      updated_at: profile.updated_at,
      first_name: profile.first_name,
      last_name: profile.last_name,
    };
  });
};

export const useProfiles = () => {
  return useQuery<User[], Error>({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });
};