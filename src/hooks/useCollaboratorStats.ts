import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

export interface CollaboratorStat extends User {
  project_count: number;
  upcoming_project_count: number;
  ongoing_project_count: number;
  active_task_count: number;
  active_ticket_count: number;
  overdue_bill_count: number;
  created_task_count: number;
  assigned_task_count: number;
  completed_assigned_task_count: number;
  completed_on_time_count: number;
  overdue_task_count: number;
  completed_created_task_count: number;
  slug: string | null;
}

const fetchCollaboratorStats = async (): Promise<CollaboratorStat[]> => {
  const { data, error } = await supabase.rpc('get_collaborator_stats');
  if (error) {
    throw new Error(`Failed to fetch collaborator stats: ${error.message}`);
  }
  return data as CollaboratorStat[];
};

export const useCollaboratorStats = () => {
  return useQuery<CollaboratorStat[], Error>({
    queryKey: ['collaboratorStats'],
    queryFn: fetchCollaboratorStats,
  });
};