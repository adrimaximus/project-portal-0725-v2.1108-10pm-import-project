import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/user';
import { getInitials, getAvatarUrl } from '@/lib/utils';

const fetchProfiles = async (): Promise<Profile[]> => {
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
    };
  });
};

export const useProfiles = () => {
  return useQuery<Profile[], Error>({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });
};