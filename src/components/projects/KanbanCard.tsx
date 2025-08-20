import { Project } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MessageSquare } from 'lucide-react';
import { formatInJakarta, getColorForTag } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  project: Project;
}

const KanbanCard = ({ project }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: {
      type: 'Project',
      project,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className={cn(
        "mb-4 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <CardContent className="p-3 space-y-2">
        <p className="font-semibold text-sm leading-snug">{project.name}</p>
        <div className="flex items-center text-xs text-muted-foreground space-x-4">
          {project.due_date && (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1.5" />
              <span>{formatInJakarta(project.due_date, 'd MMM')}</span>
            </div>
          )}
          {project.comments && (
            <div className="flex items-center">
              <MessageSquare className="h-3 w-3 mr-1.5" />
              <span>{project.comments.length}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {project.assignedTo.slice(0, 3).map(user => (
              <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="flex gap-1 flex-wrap justify-end max-w-[50%]">
            {project.category && (
              <Badge 
                variant="outline" 
                className={cn("text-xs", getColorForTag(project.category).bg, getColorForTag(project.category).text, getColorForTag(project.category).border)}
              >
                {project.category}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KanbanCard;