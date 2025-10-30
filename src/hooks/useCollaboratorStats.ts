import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { getInitials } from '@/lib/utils';

type CollaboratorStatData = {
  user_id: string;
  project_count: number;
  upcoming_project_count: number;
  ongoing_project_count: number;
  active_task_count: number;
  active_ticket_count: number;
  overdue_bill_count: number;
};

export type CollaboratorStat = User & CollaboratorStatData;

const fetchCollaboratorStats = async (): Promise<CollaboratorStat[]> => {
  const { data: stats, error: statsError } = await supabase.rpc('get_collaborator_stats');
  if (statsError) throw statsError;

  const userIds = stats.map((s: CollaboratorStatData) => s.user_id);
  if (userIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, avatar_url, role');
  if (profilesError) throw profilesError;

  const profileMap = new Map(profiles.map(p => [p.id, p]));

  return stats.map((stat: CollaboratorStatData) => {
    const profile = profileMap.get(stat.user_id);
    const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    return {
      ...stat,
      id: stat.user_id,
      name: fullName || profile?.email || 'Unknown User',
      email: profile?.email,
      avatar_url: profile?.avatar_url,
      role: profile?.role || 'member',
      initials: getInitials(fullName, profile?.email) || 'NN',
    };
  });
};

export const useCollaboratorStats = () => {
  return useQuery<CollaboratorStat[], Error>({
    queryKey: ['collaboratorStats'],
    queryFn: fetchCollaboratorStats,
  });
};