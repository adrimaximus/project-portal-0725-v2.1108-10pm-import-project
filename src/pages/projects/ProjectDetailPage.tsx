import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PortalLayout from '@/components/PortalLayout';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectServices from '@/components/project-detail/ProjectServices';

const getProjectDetails = async (projectId: string) => {
  const { data, error } = await supabase.rpc('get_dashboard_projects');

  if (error) throw new Error(error.message);
  
  const project = data?.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found or you do not have access.');

  return project;
};

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading, isError, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProjectDetails(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <PortalLayout><div className="flex items-center justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div></PortalLayout>;
  }

  if (isError) {
    return <PortalLayout><div>Error: {error.message}</div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
        
        <ProjectServices services={project.services} />
        
        {/* Other project details can be added here */}
      </div>
    </PortalLayout>
  );
};

export default ProjectDetailPage;