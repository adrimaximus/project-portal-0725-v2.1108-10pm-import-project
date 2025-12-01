import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getProjectBySlug } from '@/lib/projectsApi';
import ProjectHeader from '@/components/projects/ProjectHeader';
import ProjectTabs from '@/components/projects/ProjectTabs';

const ProjectDetail = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();

  const { data: projectWithDetails, isLoading, error } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => getProjectBySlug(slug as string),
    enabled: !!slug,
  });

  if (isLoading || !projectWithDetails) {
    return (
      <div className="flex justify-center h-full pt-[30vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">Error loading project: {(error as Error).message}</div>;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <ProjectHeader project={projectWithDetails} />
      <ProjectTabs project={projectWithDetails} defaultTab={searchParams.get('tab') || 'overview'} />
    </div>
  );
};

export default ProjectDetail;