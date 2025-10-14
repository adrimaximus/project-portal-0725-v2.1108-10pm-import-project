import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types";

export const getProjectBySlug = async (slug: string): Promise<Project> => {
  const { data, error } = await supabase
    .rpc('get_project_by_slug', { p_slug: slug })
    .single();

  if (error) {
    console.error("Error fetching project by slug:", error);
    throw new Error(error.message);
  }

  const projectData = data as any;

  // The RPC returns JSON strings for nested arrays, so we need to parse them.
  return {
    ...projectData,
    assignedTo: typeof projectData.assignedTo === 'string' ? JSON.parse(projectData.assignedTo) : projectData.assignedTo,
    tasks: typeof projectData.tasks === 'string' ? JSON.parse(projectData.tasks) : projectData.tasks,
    comments: typeof projectData.comments === 'string' ? JSON.parse(projectData.comments) : projectData.comments,
    briefFiles: typeof projectData.briefFiles === 'string' ? JSON.parse(projectData.briefFiles) : projectData.briefFiles,
    activities: typeof projectData.activities === 'string' ? JSON.parse(projectData.activities) : projectData.activities,
  } as Project;
};