import { Project } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { User } from 'lucide-react';
import StatusBadge from '../StatusBadge';

const ProjectCard = ({ project }: { project: Project }) => {
  return (
    <Link to={`/projects/${project.slug}`}>
      <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate flex items-center gap-2">
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
                {project.name}
              </CardTitle>
              <div className="mt-1">
                <StatusBadge status={project.status} />
              </div>
            </div>
            {project.client_company_logo_url && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-shrink-0">
                      <img src={project.client_company_logo_url} alt={project.client_company_name || 'Client Logo'} className="h-10 w-10 object-contain" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{project.client_company_name || 'Client'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground h-10 line-clamp-2">{project.description}</p>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} />
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex -space-x-2">
            {project.assignedTo.slice(0, 3).map(user => (
              <Avatar key={user.id} className="h-8 w-8 border-2 border-card">
                <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
              </Avatar>
            ))}
            {project.assignedTo.length > 3 && (
              <Avatar className="h-8 w-8 border-2 border-card">
                <AvatarFallback>+{project.assignedTo.length - 3}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProjectCard;