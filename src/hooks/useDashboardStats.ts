import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type DashboardStats = {
  totalProjects: number;
  ongoingProjects: number;
  upcomingProjects: number;
  activeTasks: number;
  activeTickets: number;
  overdueBills: number;
};

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  // Get all accessible projects for the current user
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, status, start_date, payment_due_date, payment_status, personal_for_user_id');
  
  if (projectsError) throw projectsError;

  // Filter out personal projects and calculate stats
  const nonPersonalProjects = projects.filter(p => !p.personal_for_user_id);
  
  const totalProjects = nonPersonalProjects.length;
  const ongoingProjects = nonPersonalProjects.filter(p => 
    p.status && !['Completed', 'Cancelled'].includes(p.status)
  ).length;
  const upcomingProjects = nonPersonalProjects.filter(p => 
    p.start_date && new Date(p.start_date) > new Date()
  ).length;
  const overdueBills = nonPersonalProjects.filter(p => 
    p.payment_due_date && 
    new Date(p.payment_due_date) < new Date() && 
    p.payment_status !== 'Paid'
  ).length;

  // Get all tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, completed, origin_ticket_id')
    .eq('completed', false);
  
  if (tasksError) throw tasksError;

  const activeTasks = tasks.length;
  const activeTickets = tasks.filter(t => t.origin_ticket_id).length;

  return {
    totalProjects,
    ongoingProjects,
    upcomingProjects,
    activeTasks,
    activeTickets,
    overdueBills,
  };
};

export const useDashboardStats = () => {
  return useQuery<DashboardStats, Error>({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });
};