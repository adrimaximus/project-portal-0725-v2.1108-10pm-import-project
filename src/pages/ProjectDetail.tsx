import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ProjectMainContent from '@/components/project-detail/ProjectMainContent';
import { Loader2 } from 'lucide-react';
import { Project } from '@/types';

const fetchProjectBySlug = async (slug: string): Promise<Project> => {
  const { data, error } = await supabase
    .rpc('get_project_by_slug', { p_slug: slug })
    .single();
  if (error) throw new Error(error.message);
  return data as Project;
};

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { isLoading: authLoading } = useAuth();

  const { data: project, isLoading: projectLoading, error } = useQuery<Project>({
    queryKey: ['project', slug],
    queryFn: () => fetchProjectBySlug(slug!),
    enabled: !!slug && !authLoading,
  });

  if (authLoading || projectLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div>Error loading project: {error.message}</div>;
  }
  
  if (!project) {
    return <div>Project not found.</div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <ProjectMainContent project={project} />
    </div>
  );
};

export default ProjectDetail;