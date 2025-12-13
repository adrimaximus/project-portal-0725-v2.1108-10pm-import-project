import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';

// Define the payload type explicitly to avoid partial issues
type CreateProjectPayload = {
    name: string;
    description?: string;
    category?: string;
    start_date?: string;
    due_date?: string;
    budget?: number;
    origin_event_id?: string;
    venue?: string;
    client_company_id?: string | null;
};

export const getDashboardProjects = async ({ 
  limit, 
  offset, 
  searchTerm, 
  excludeOtherPersonal, 
  year,
  timeframe,
  sortDirection
}: { 
  limit: number, 
  offset: number, 
  searchTerm: string | null, 
  excludeOtherPersonal: boolean, 
  year: number | null,
  timeframe?: 'upcoming' | 'past' | null,
  sortDirection?: 'asc' | 'desc'
}): Promise<Project[]> => {
  // Use V2 function to avoid ambiguity with the legacy function signature
  const { data, error } = await supabase.rpc('get_dashboard_projects_v2', {
    p_limit: limit,
    p_offset: offset,
    p_search_term: searchTerm || null,
    p_exclude_other_personal: excludeOtherPersonal,
    p_year: year,
    p_timeframe: timeframe || null,
    p_sort_direction: sortDirection || 'desc'
  });
  if (error) throw error;
  return data as Project[];
};

export const createProject = async (projectData: Partial<Project>): Promise<Project> => {
    // Cast to internal payload to ensure properties exist
    const payload = projectData as CreateProjectPayload;

    const { data, error } = await supabase
      .rpc('create_project', {
        p_name: payload.name || 'Untitled Project',
        p_description: payload.description,
        p_category: payload.category || 'General',
        p_start_date: payload.start_date,
        p_due_date: payload.due_date,
        p_budget: payload.budget,
        p_origin_event_id: payload.origin_event_id,
        p_venue: payload.venue,
        p_client_company_id: payload.client_company_id,
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