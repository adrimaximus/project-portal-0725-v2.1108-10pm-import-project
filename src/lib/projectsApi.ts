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

export const getProjectBySlug = async (slug: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .rpc('get_project_by_slug', { p_slug: slug })
    .single();

  if (error) {
    console.error("Error fetching project by slug:", error);
    throw new Error(error.message);
  }

  if (!data) return null;

  const projectData = data as any;

  // The RPC returns JSON fields which might need parsing if they are strings.
  // Tasks, comments, and activities are now fetched separately on the project page.
  return {
    ...projectData,
    assignedTo: safeParse(projectData.assignedTo) || [],
    briefFiles: safeParse(projectData.briefFiles) || [],
    tags: safeParse(projectData.tags) || [],
    reactions: safeParse(projectData.reactions) || [],
    services: safeParse(projectData.services) || [],
    tasks: [],
    comments: [],
    activities: [],
  } as Project;
};