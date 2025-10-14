import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types";

export const getDashboardProjects = async (limit: number, offset: number): Promise<Project[]> => {
  const { data, error } = await supabase
    .rpc('get_dashboard_projects', { p_limit: limit, p_offset: offset });

  if (error) {
    console.error("Error fetching dashboard projects:", error);
    throw new Error(error.message);
  }
  return data as Project[];
};