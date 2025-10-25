import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';
import { Loader2, Calendar, DollarSign, Users, FileText, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getProjectStatusStyles, formatInJakarta, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { isSameDay, subDays } from 'date-fns';

const fetchPublicProject = async (slug: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .rpc('get_project_by_slug', { p_slug: slug })
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found or no access
    console.error("Error fetching public project:", error);
    throw new Error(error.message);
  }
  return data as Project | null;
};

const PublicProjectPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['publicProject', slug],
    queryFn: () => fetchPublicProject(slug!),
    enabled: !!slug,
  });

  const renderDateRange = () => {
    if (!project?.start_date) return 'N/A';
    const start = new Date(project.start_date);
    const end = project.due_date ? new Date(project.due_date) : start;

    const isExclusiveEndDate =
      project.due_date &&
      end.getUTCHours() === 0 &&
      end.getUTCMinutes() === 0 &&
      end.getUTCSeconds() === 0 &&
      end.getUTCMilliseconds() === 0 &&
      !isSameDay(start, end);

    const adjustedEnd = isExclusiveEndDate ? subDays(end, 1) : end;

    if (isSameDay(start, adjustedEnd)) {
        return formatInJakarta(project.start_date, "dd MMM yyyy");
    }
    return `${formatInJakarta(project.start_date, "dd MMM yyyy")} - ${formatInJakarta(adjustedEnd, "dd MMM yyyy")}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-center">
        <div>
          <h1 className="text-2xl font-bold">Project Not Found</h1>
          <p className="text-muted-foreground">This project may not exist or is not public.</p>
        </div>
      </div>
    );
  }

  const statusStyles = getProjectStatusStyles(project.status);

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: statusStyles.hex }} />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
              <Badge variant="outline" className={statusStyles.tw}>{project.status}</Badge>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {project.description && (
              <Card>
                <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: project.description }} />
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks /> Tasks</CardTitle></CardHeader>
              <CardContent>
                {project.tasks && project.tasks.length > 0 ? (
                  <ul className="space-y-2">
                    {project.tasks.map(task => (
                      <li key={task.id} className={`flex items-center gap-2 ${task.completed ? 'text-muted-foreground line-through' : ''}`}>
                        <div className={`w-4 h-4 rounded-sm border ${task.completed ? 'bg-primary' : ''}`} />
                        <span>{task.title}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-muted-foreground">No tasks for this project.</p>}
              </CardContent>
            </Card>
            {project.briefFiles && project.briefFiles.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><FileText /> Files</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {project.briefFiles.map(file => (
                      <li key={file.id}>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{file.name}</a>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader><CardTitle>Details</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Timeline</p>
                    <p className="text-muted-foreground">{renderDateRange()}</p>
                  </div>
                </div>
                {project.budget && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Budget</p>
                      <p className="text-muted-foreground">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(project.budget)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users /> Team</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {project.assignedTo.map(user => (
                  <div key={user.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                      <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PublicProjectPage;