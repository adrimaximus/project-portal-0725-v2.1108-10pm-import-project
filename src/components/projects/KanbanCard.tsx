import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatInJakarta, cn, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare,
  Paperclip,
  ListChecks,
  Calendar,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/core';

interface KanbanCardProps {
  project: Project;
}

const KanbanCard = ({ project }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: project.id,
    data: { project },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="mb-4 bg-card hover:shadow-lg transition-shadow cursor-grab active:cursor-grabbing"
    >
      <Link to={`/projects/${project.slug}`} className="block">
        <CardHeader className="p-4">
          <CardTitle className="text-base font-semibold leading-tight group-hover:text-primary">
            {project.name}
          </CardTitle>
          <Badge variant="outline" className="w-fit mt-1">{project.category}</Badge>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {project.description}
          </p>
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>{project.comments?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" />
                <span>{project.briefFiles?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <ListChecks className="h-3.5 w-3.5" />
                <span>{project.tasks?.length || 0}</span>
              </div>
            </div>
            {project.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatInJakarta(new Date(project.due_date), 'd MMM')}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center -space-x-2">
              <TooltipProvider>
                {project.assignedTo?.slice(0, 3).map((user) => (
                  <Tooltip key={user.id}>
                    <TooltipTrigger>
                      <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                        <AvatarImage src={getAvatarUrl(user.avatar_url) || undefined} />
                        <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>{user.initials}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{user.name}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {project.assignedTo && project.assignedTo.length > 3 && (
                  <Avatar className="h-6 w-6 border-2 border-card">
                    <AvatarFallback>+{project.assignedTo.length - 3}</AvatarFallback>
                  </Avatar>
                )}
              </TooltipProvider>
            </div>
            {project.client_name && (
              <Badge variant="secondary" className="font-normal">
                {project.client_name}
              </Badge>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default KanbanCard;