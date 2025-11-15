import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';

const safeParse = (value: any) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

export const getDashboardProjects = async ({ 
  limit, 
  offset, 
  searchTerm, 
  excludeOtherPersonal, 
  year,
  timeframe,
  sortDirection,
  personId
}: { 
  limit: number, 
  offset: number, 
  searchTerm: string | null, 
  excludeOtherPersonal: boolean, 
  year: number | null,
  timeframe?: 'upcoming' | 'past' | null,
  sortDirection?: 'asc' | 'desc',
  personId?: string | null
}): Promise<Project[]> => {
  const { data, error } = await supabase.rpc('get_dashboard_projects', {
    p_limit: limit,
    p_offset: offset,
    p_search_term: searchTerm || null,
    p_exclude_other_personal: excludeOtherPersonal,
    p_year: year,
    p_timeframe: timeframe || null,
    p_sort_direction: sortDirection || 'desc',
    p_person_id: personId || null,
  });
  if (error) throw error;
  return data as Project[];
};

export const createProject = async (projectData: Partial<Project>): Promise<Project> => {
    const { data, error } = await supabase
      .rpc('create_project', {
        p_name: projectData.name,
        p_description: projectData.description,
        p_category: projectData.category,
        p_start_date: projectData.start_date,
        p_due_date: projectData.due_date,
        p_budget: projectData.budget,
        p_origin_event_id: projectData.origin_event_id,
        p_venue: projectData.venue,
        p_client_company_id: projectData.client_company_id,
      })
      .single();

    if (error) {
        console.error('Error creating project via RPC:', error);
        throw new Error(error.message);
    }

    return data as Project;
};

export const updateProjectDetails = async (projectData: Partial<Project> & { id: string }): Promise<Project> => {
    const { id, ...updates } = projectData;
    const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Project;
};

export const deleteProject = async (projectId: string): Promise<void> => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;
};