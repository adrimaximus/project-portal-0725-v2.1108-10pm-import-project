import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, Person } from '@/types';

const fetchProject = async (slug: string): Promise<Project | null> => {
  const { data: projectData, error: projectError } = await supabase
    .rpc('get_project_by_slug', { p_slug: slug })
    .single();

  if (projectError) {
    // PGRST116 berarti tidak ada baris yang ditemukan, yang bukan merupakan kesalahan dalam konteks ini.
    if (projectError.code === 'PGRST116') {
      return null;
    }
    console.error("Error fetching project:", projectError);
    throw new Error(projectError.message);
  }
  if (!projectData) return null;

  // Fetch linked people (clients)
  const { data: peopleLinks, error: peopleError } = await supabase
    .from('people_projects')
    .select('people(*)')
    .eq('project_id', (projectData as any).id);

  if (peopleError) {
    console.error("Error fetching linked people:", peopleError);
  }

  const people = peopleLinks ? peopleLinks.map((link: any) => link.people).filter(Boolean) : [];

  return { ...(projectData as any), people } as Project | null;
};

export const useProject = (slug: string) => {
  return useQuery<Project | null>({
    queryKey: ["project", slug],
    queryFn: () => fetchProject(slug),
    enabled: !!slug,
  });
};