import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';

const fetchProject = async (slug: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .rpc('get_project_by_slug', { p_slug: slug })
    .single();

  if (error) {
    // PGRST116 berarti tidak ada baris yang ditemukan, yang bukan merupakan kesalahan dalam konteks ini.
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error("Error fetching project:", error);
    throw new Error(error.message);
  }
  return data as Project | null;
};

export const useProject = (slug: string) => {
  return useQuery<Project | null>({
    queryKey: ["project", slug],
    queryFn: () => fetchProject(slug),
    enabled: !!slug,
  });
};