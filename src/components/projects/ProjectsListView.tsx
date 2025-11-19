import { Project } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import StatusBadge from '../StatusBadge';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';

const ProjectsListView = ({ projects, onDeleteProject }: { projects: Project[], onDeleteProject: (projectId: string) => void }) => {
  const { data: statuses = [] } = useProjectStatuses();

  return (
    <div className="space-y-4 p-4 md:p-6">
      {projects.map(project => {
        // Find status definition to get color
        const statusDef = statuses.find(s => s.name === project.status);
        const borderColor = statusDef?.color || '#e5e7eb';

        return (
          <div 
            key={project.id} 
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted border-l-4"
            style={{ borderLeftColor: borderColor }}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex -space-x-2">
                {project.assignedTo.slice(0, 2).map(user => (
                  <Avatar key={user.id} className="h-8 w-8 border-2 border-card">
                    <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                    <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {project.personal_for_user_id && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <User className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Personal Project</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Link to={`/projects/${project.slug}`} className="font-medium text-primary hover:underline truncate block">{project.name}</Link>
                </div>
                <p className="text-sm text-muted-foreground">Updated {formatDistanceToNow(new Date(project.updated_at || project.created_at), { addSuffix: true })}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <StatusBadge status={project.status} projectId={project.id} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onDeleteProject(project.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectsListView;