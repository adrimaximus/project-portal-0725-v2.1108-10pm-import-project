import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, Person } from '@/types';

const fetchProject = async (slug: string): Promise<Project | null> => {
  const { data: projectData, error: projectError } = await supabase
    .rpc('get_project_by_slug', { p_slug: slug })
    .single();

  if (projectError) {
    // PGRST116: "Not a single row was found" - This is expected if the slug is wrong or user lacks permission.
    if (projectError.code === 'PGRST116') {
      console.warn(`Project with slug "${slug}" not found or user lacks permission.`);
      return null;
    }
    console.error("Error fetching project:", projectError);
    throw new Error(projectError.message);
  }
  if (!projectData) return null;

  const projectDataAsAny = projectData as any;

  // Fetch linked people (clients)
  const { data: peopleLinks, error: peopleError } = await supabase
    .from('people_projects')
    .select('people(*)')
    .eq('project_id', projectDataAsAny.id);

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

  const parsedComments = (safeParse(projectDataAsAny.comments) || []).map((comment: any) => ({
    ...comment,
    // The RPC already builds the author object, so we don't need to parse it.
    // But let's ensure attachments_jsonb is an array.
    attachments_jsonb: safeParse(comment.attachments_jsonb) || [],
  }));

  return { 
    ...(projectDataAsAny), 
    people,
    comments: parsedComments,
    assignedTo: safeParse(projectDataAsAny.assignedTo),
    tasks: safeParse(projectDataAsAny.tasks),
    briefFiles: safeParse(projectDataAsAny.briefFiles),
    activities: safeParse(projectDataAsAny.activities),
    tags: safeParse(projectDataAsAny.tags),
  } as Project | null;
};

export const useProject = (slug: string) => {
  return useQuery<Project | null>({
    queryKey: ["project", slug],
    queryFn: () => fetchProject(slug),
    enabled: !!slug,
  });
};