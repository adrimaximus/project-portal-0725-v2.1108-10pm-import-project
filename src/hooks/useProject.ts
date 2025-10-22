import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, Person } from '@/types';

const fetchProject = async (slug: string): Promise<Project | null> => {
  const { data: projectData, error: projectError } = await supabase
    .rpc('get_project_by_slug', { p_slug: slug })
    .single();

  if (projectError) {
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

  // The RPC returns JSON fields which might need parsing if they are strings.
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

  const parsedComments = (safeParse(projectData.comments) || []).map((comment: any) => ({
    ...comment,
    // The RPC already builds the author object, so we don't need to parse it.
    // But let's ensure attachments_jsonb is an array.
    attachments_jsonb: safeParse(comment.attachments_jsonb) || [],
  }));

  return { 
    ...(projectData as any), 
    people,
    comments: parsedComments,
    assignedTo: safeParse(projectData.assignedTo),
    tasks: safeParse(projectData.tasks),
    briefFiles: safeParse(projectData.briefFiles),
    activities: safeParse(projectData.activities),
    tags: safeParse(projectData.tags),
  } as Project | null;
};

export const useProject = (slug: string) => {
  return useQuery<Project | null>({
    queryKey: ["project", slug],
    queryFn: () => fetchProject(slug),
    enabled: !!slug,
  });
};