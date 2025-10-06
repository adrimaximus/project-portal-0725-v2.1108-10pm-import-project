import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { ProjectHeader } from '@/components/project-detail/ProjectHeader';
import ProjectDetailsCard from '@/components/project-detail/ProjectDetailsCard';
import ProjectTeamCard from '@/components/project-detail/ProjectTeamCard';
import ProjectMainContent from '@/components/project-detail/ProjectMainContent';
import { useAuth } from '@/contexts/AuthContext';
import { Project } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const { data: project, isLoading, error, refetch } = useQuery<Project>({
    queryKey: ['project', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_project_by_slug', { p_slug: slug })
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      if (!data) {
        throw new Error('Project not found');
      }
      return data as Project;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="p-4 md:p-6 space-y-6">
          <Skeleton className="h-12 w-1/2" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (error) {
    return (
      <PortalLayout>
        <div className="p-4 md:p-6">
          <h1 className="text-2xl font-bold text-destructive">Error loading project</h1>
          <p>{error.message}</p>
        </div>
      </PortalLayout>
    );
  }

  if (!project) {
    return (
      <PortalLayout>
        <div className="p-4 md:p-6">
          <h1 className="text-2xl font-bold">Project not found</h1>
        </div>
      </PortalLayout>
    );
  }

  const canEdit = user && typeof project.created_by === 'object' && (user.id === project.created_by.id || user.role === 'admin' || user.role === 'master admin');

  return (
    <PortalLayout>
      <div className="p-4 md:p-6 space-y-6">
        <ProjectHeader project={project} canEdit={canEdit} onProjectUpdate={refetch} />
        <div className="grid md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-6">
            <ProjectMainContent project={project} onProjectUpdate={refetch} />
          </div>
          <div className="space-y-6">
            <ProjectDetailsCard project={project} />
            <ProjectTeamCard project={project} onProjectUpdate={refetch} />
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectDetail;