import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getProjectBySlug } from '@/lib/projectsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectActivityFeed from '@/components/project-detail/ProjectActivityFeed';
import ProjectTasks from '@/components/project-detail/ProjectTasks';
import { Loader2 } from 'lucide-react';

const ProjectDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => getProjectBySlug(slug!),
    enabled: !!slug,
  });

  useEffect(() => {
    if (!project) return;

    const channel = supabase
      .channel(`project-updates-${project.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${project.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project', slug] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_activities',
          filter: `project_id=eq.${project.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project', slug] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project, slug, queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive p-4">Error loading project: {error.message}</div>;
  }

  if (!project) {
    return <div className="p-4">Project not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{project.description}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectTasks tasks={project.tasks || []} projectId={project.id} />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectActivityFeed activities={project.activities || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectDetailPage;