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

  // The RPC returns JSON strings for nested arrays, so we need to parse them.
  return {
    ...projectData,
    assignedTo: safeParse(projectData.assignedTo) || [],
    tasks: safeParse(projectData.tasks) || [],
    comments: safeParse(projectData.comments) || [],
    briefFiles: safeParse(projectData.briefFiles) || [],
    activities: safeParse(projectData.activities) || [],
    tags: safeParse(projectData.tags) || [],
    reactions: safeParse(projectData.reactions) || [],
    services: safeParse(projectData.services) || [],
  } as Project;
};