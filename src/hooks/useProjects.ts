import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      created_by:profiles!created_by(*),
      project_members(role, profiles(*)),
      project_tags(tags(*)),
      project_services(service_title),
      invoice_attachments(*),
      people_projects(people(*, companies(*)))
    `)
    .order('kanban_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false });
    
  if (error) {
    console.error('Error fetching projects:', error);
    toast.error('Failed to fetch projects.', { description: error.message });
    throw new Error(error.message);
  }
  
  // Transform the data to match the shape expected by the application
  return data.map((p: any) => {
    const assignedTo = p.project_members.map((m: any) => ({
      ...(m.profiles || {}),
      id: m.profiles?.id,
      role: m.role,
      name: `${m.profiles?.first_name || ''} ${m.profiles?.last_name || ''}`.trim() || m.profiles?.email,
      initials: `${m.profiles?.first_name?.[0] || ''}${m.profiles?.last_name?.[0] || ''}`.toUpperCase(),
    }));

    // Ensure the project owner is in the assignedTo list
    if (p.created_by && !assignedTo.some((m: any) => m.id === p.created_by.id)) {
      assignedTo.push({
        ...p.created_by,
        role: 'owner',
        name: `${p.created_by.first_name || ''} ${p.created_by.last_name || ''}`.trim() || p.created_by.email,
        initials: `${p.created_by.first_name?.[0] || ''}${p.created_by.last_name?.[0] || ''}`.toUpperCase(),
      });
    }

    return {
      ...p,
      assignedTo,
      services: p.project_services.map((s: any) => s.service_title),
      tags: p.project_tags.map((t: any) => t.tags).filter(Boolean),
      client_name: p.people_projects[0]?.people?.full_name || null,
      client_company_name: p.people_projects[0]?.people?.companies?.name || p.people_projects[0]?.people?.company || null,
      client_company_logo_url: p.people_projects[0]?.people?.companies?.logo_url || null,
      client_company_custom_properties: p.people_projects[0]?.people?.companies?.custom_properties || null,
      // The RPC also returned tasks and comments, which we are omitting for now for dashboard performance.
      // The ProjectDetail page will fetch these separately.
      tasks: [],
      comments: [],
      activities: [],
      briefFiles: [],
    };
  });
};

export const useProjects = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-projects-and-members')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_members' },
        (payload) => {
          console.log('Project members change received, refetching projects.', payload);
          queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('Projects table change received, refetching projects.', payload);
          queryClient.invalidateQueries({ queryKey: ['projects', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery<Project[], Error>({
    queryKey: ['projects', user?.id],
    queryFn: fetchProjects,
    enabled: !!user,
  });
};