import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export const useTeamMembers = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['teamMembers'],
    queryFn: async (): Promise<User[]> => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data
        .filter(profile => profile.id !== user?.id)
        .map(profile => {
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
          return {
            id: profile.id,
            name: fullName || profile.email || 'No name',
            email: profile.email,
            avatar_url: getAvatarUrl(profile),
            role: profile.role,
            status: profile.status,
            initials: getInitials(fullName) || 'NN',
            updated_at: profile.updated_at,
          };
        });
    },
    enabled: !!user,
  });
};