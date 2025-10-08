import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { getInitials, getAvatarUrl } from '@/lib/utils';

export const useTeamMembers = () => {
  return useQuery<User[]>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data.map(profile => {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
        return {
          id: profile.id,
          name: fullName || profile.email,
          email: profile.email,
          avatar_url: getAvatarUrl(profile.avatar_url),
          role: profile.role,
          initials: getInitials(fullName, profile.email)
        }
      });
    },
  });
};