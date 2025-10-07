import { Project } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import {
  MessageSquare,
  Paperclip,
  ListChecks,
  Calendar,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatInJakarta, cn, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Badge } from '../ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Link } from 'react-router-dom';

interface KanbanCardProps {
  project: Project;
}

const KanbanCard = ({ project }: KanbanCardProps) => {
  const taskCount = project.tasks?.length || 0;
  const completedTaskCount = project.tasks?.filter(t => t.completed).length || 0;

  return (
    <Link to={`/projects/${project.slug}`} className="block">
      <Card className="mb-3 hover:shadow-lg transition-shadow">
        <CardContent className="p-3">
          {project.category && (
            <Badge variant="secondary" className="mb-2 font-normal">{project.category}</Badge>
          )}
          <h3 className="font-semibold text-sm mb-2">{project.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {project.description}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              <span>{completedTaskCount}/{taskCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{project.comments?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              <span>{project.briefFiles?.length || 0}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            {project.due_date ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatInJakarta(project.due_date, 'MMM d')}</span>
              </div>
            ) : <div />}
            <div className="flex -space-x-2">
              {project.assignedTo?.map(user => (
                <TooltipProvider key={user.id}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                        <AvatarImage src={getAvatarUrl(user)} />
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
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default KanbanCard;