import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import StatusBadge from '../StatusBadge';
import { Project } from '@/types';

interface UserProfileProjectsProps {
  userId: string;
}

const UserProfileProjects = ({ userId }: UserProfileProjectsProps) => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['userProjects', userId],
    queryFn: async () => {
      const { data: memberships, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId);

      if (memberError || !memberships || memberships.length === 0) {
        return [];
      }

      const projectIds = memberships.map(m => m.project_id);
      const { data: projectsData, error: projectError } = await supabase
        .from('projects')
        .select('name, slug, status')
        .in('id', projectIds)
        .order('created_at', { ascending: false });

      if (projectError) throw projectError;
      return projectsData as Pick<Project, 'name' | 'slug' | 'status'>[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Associated Projects</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !projects || projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">This user is not associated with any projects.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map(project => (
                <TableRow key={project.slug}>
                  <TableCell>
                    <Link to={`/projects/${project.slug}`} className="font-medium text-primary hover:underline">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UserProfileProjects;