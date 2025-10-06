import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, Users, Tag, CheckCircle, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ProjectInfoCardProps {
  project: Project;
}

const ProjectInfoCard = ({ project }: ProjectInfoCardProps) => {
  const { hasPermission } = useAuth();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div className="flex items-start gap-3">
          <Briefcase className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
          <div>
            <p className="text-muted-foreground">Category</p>
            <p className="font-medium">{project.category || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium">{project.status}</p>
          </div>
        </div>
        
        {hasPermission('project:budget:read') && (
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
            <div>
              <p className="text-muted-foreground">Budget</p>
              <p className="font-medium">
                {project.budget ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(project.budget) : 'N/A'}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
          <div>
            <p className="text-muted-foreground">Timeline</p>
            <p className="font-medium">{formatDate(project.start_date)} - {formatDate(project.due_date)}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 md:col-span-2">
          <Users className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
          <div>
            <p className="text-muted-foreground">Team</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {project.created_by && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={project.created_by.avatar_url} />
                        <AvatarFallback>{project.created_by.initials}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{project.created_by.name} (Owner)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {project.assignedTo?.map((member) => (
                <TooltipProvider key={member.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>{member.initials}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{member.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        </div>

        {project.tags && project.tags.length > 0 && (
          <div className="flex items-start gap-3 md:col-span-2">
            <Tag className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
            <div>
              <p className="text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {project.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color, color: 'white' }}>{tag.name}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectInfoCard;