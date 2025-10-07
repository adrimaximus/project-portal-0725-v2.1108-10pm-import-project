import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { getStatusStyles, formatInJakarta, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { format, isSameDay, subDays } from 'date-fns';
import {
  MessageSquare,
  Paperclip,
  ListChecks,
  Calendar,
  MoreHorizontal,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

interface ListViewProps {
  projects: Project[];
  isLoading: boolean;
  onDeleteProject: (projectId: string) => void;
}

const ProjectListItem = ({ project, onDeleteProject }: { project: Project; onDeleteProject: (projectId: string) => void; }) => {
  const statusStyle = getStatusStyles(project.status);
  const isNew = project.created_at && isSameDay(new Date(project.created_at), new Date());
  const wasRecent = project.created_at && new Date(project.created_at) > subDays(new Date(), 7);

  const taskCount = project.tasks?.length || 0;
  const completedTaskCount = project.tasks?.filter(t => t.completed).length || 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Link to={`/projects/${project.slug}`}>
                    <CardTitle className="text-lg hover:underline">{project.name}</CardTitle>
                  </Link>
                  {isNew && <Badge variant="secondary">New</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{project.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusStyle.className}>{project.status}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteProject(project.id)} className="text-red-500">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {project.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {project.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-1">
                <ListChecks className="h-4 w-4" />
                <span>{completedTaskCount}/{taskCount} tasks</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{project.comments?.length || 0} comments</span>
              </div>
              <div className="flex items-center gap-1">
                <Paperclip className="h-4 w-4" />
                <span>{project.briefFiles?.length || 0} files</span>
              </div>
              {project.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Due {format(new Date(project.due_date), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 sm:w-48 flex flex-col justify-between items-end">
            <div className="flex -space-x-2">
              {project.assignedTo?.map(user => (
                <TooltipProvider key={user.id}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar key={user.id} className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-card">
                        <AvatarImage src={getAvatarUrl(user)} alt={user.name} />
                        <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2 sm:mt-0">
              {wasRecent && !isNew && `Created ${format(new Date(project.created_at!), 'MMM d')}`}
              {!wasRecent && !isNew && project.created_at && `Created ${format(new Date(project.created_at), 'MMM d, yyyy')}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ListView = ({ projects, isLoading, onDeleteProject }: ListViewProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-grow space-y-3">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="w-48 flex flex-col items-end space-y-2">
                  <div className="flex -space-x-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map(project => (
        <ProjectListItem key={project.id} project={project} onDeleteProject={onDeleteProject} />
      ))}
    </div>
  );
};

export default ListView;