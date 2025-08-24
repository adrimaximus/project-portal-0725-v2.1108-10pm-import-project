import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { getInitials } from '@/lib/utils';

const fetchTeamMembers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
    throw new Error(error.message);
  }
  return data.map(profile => {
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return {
      id: profile.id,
      name: fullName || profile.email || 'No name',
      email: profile.email,
      avatar: profile.avatar_url,
      role: profile.role,
      status: profile.status,
      initials: getInitials(fullName, profile.email) || 'NN',
      updated_at: profile.updated_at,
    };
  });
};

export const useTeamMembers = () => {
  return useQuery<User[], Error>({
    queryKey: ['teamMembers'],
    queryFn: fetchTeamMembers,
  });
};