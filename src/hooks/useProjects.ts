import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/data/projects';
import { useAuth } from '@/contexts/AuthContext';

const fetchProjects = async () => {
  const { data, error } = await supabase.rpc('get_dashboard_projects');

  if (error) {
    throw new Error(error.message);
  }

  // Map snake_case from DB to camelCase in the app
  return data.map((p: any) => ({
    ...p,
    startDate: p.start_date,
    dueDate: p.due_date,
    paymentStatus: p.payment_status,
    paymentDueDate: p.payment_due_date,
    createdBy: p.created_by,
    assignedTo: p.assignedTo,
    briefFiles: p.briefFiles,
  })) as Project[];
};

export const useProjects = () => {
  const { user } = useAuth();
  return useQuery<Project[], Error>({
    queryKey: ['projects', user?.id],
    queryFn: fetchProjects,
    enabled: !!user,
  });
};