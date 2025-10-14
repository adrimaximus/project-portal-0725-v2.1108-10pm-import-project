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

  // The RPC returns JSON strings for nested arrays, so we need to parse them.
  return {
    ...data,
    assignedTo: typeof data.assignedTo === 'string' ? JSON.parse(data.assignedTo) : data.assignedTo,
    tasks: typeof data.tasks === 'string' ? JSON.parse(data.tasks) : data.tasks,
    comments: typeof data.comments === 'string' ? JSON.parse(data.comments) : data.comments,
    briefFiles: typeof data.briefFiles === 'string' ? JSON.parse(data.briefFiles) : data.briefFiles,
    activities: typeof data.activities === 'string' ? JSON.parse(data.activities) : data.activities,
  } as Project;
};