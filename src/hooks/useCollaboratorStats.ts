import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

type CollaboratorStatData = {
  id: string;
  name: string;
  initials: string;
  avatar_url: string | null;
  role: string;
  slug: string | null;
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

  // Data sudah lengkap dari RPC, tinggal map ke format yang dibutuhkan
  return stats.map((stat: CollaboratorStatData) => ({
    ...stat,
    email: undefined, // Email tidak di-return dari RPC untuk privacy
    first_name: undefined,
    last_name: undefined,
  }));
};

export const useCollaboratorStats = () => {
  return useQuery<CollaboratorStat[], Error>({
    queryKey: ['collaboratorStats'],
    queryFn: fetchCollaboratorStats,
  });
};