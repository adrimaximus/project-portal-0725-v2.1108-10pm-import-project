import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Project } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatInJakarta, cn, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { CheckCircle } from 'lucide-react';
import { isSameDay, subDays } from 'date-fns';

const KanbanCard = ({ project, dragHappened }: { project: Project, dragHappened: React.MutableRefObject<boolean> }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: project.id,
    data: {
      type: 'Project',
      project,
    }
  });
  const navigate = useNavigate();
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : undefined,
  };

  const handleClick = () => {
    if (!dragHappened.current) {
      navigate(`/projects/${project.slug}`);
    }
  };

  const renderDateBadge = () => {
    const { start_date, due_date } = project;

    if (!start_date) {
      return null;
    }

    const startDate = new Date(start_date);
    const dueDate = due_date ? new Date(due_date) : startDate;

    const isExclusiveEndDate = 
      due_date &&
      dueDate.getUTCHours() === 0 &&
      dueDate.getUTCMinutes() === 0 &&
      dueDate.getUTCSeconds() === 0 &&
      dueDate.getUTCMilliseconds() === 0 &&
      !isSameDay(startDate, dueDate);

    const adjustedDueDate = isExclusiveEndDate ? subDays(dueDate, 1) : dueDate;

    if (isSameDay(startDate, adjustedDueDate)) {
      return (
        <Badge variant="outline" className="text-xs font-normal">
          {formatInJakarta(start_date, 'd MMM')}
        </Badge>
      );
    }

    const startMonth = formatInJakarta(start_date, 'MMM');
    const endMonth = formatInJakarta(adjustedDueDate, 'MMM');

    if (startMonth === endMonth) {
      return (
        <Badge variant="outline" className="text-xs font-normal">
          {`${formatInJakarta(start_date, 'd')}-${formatInJakarta(adjustedDueDate, 'd')} ${startMonth}`}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-xs font-normal">
        {`${formatInJakarta(start_date, 'd MMM')} - ${formatInJakarta(adjustedDueDate, 'd MMM')}`}
      </Badge>
    );
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(isDragging && "opacity-30")}>
      <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
        <CardContent className="p-3">
          <div className="space-y-2 block">
            <h4 className="font-semibold text-sm leading-snug flex items-center gap-1.5">
              {project.status === 'Completed' && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
              {project.name}
            </h4>
            
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {project.tags.slice(0, 2).map(tag => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-xs font-normal"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      borderColor: tag.color,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                {project.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{project.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-1">
              <div className="flex -space-x-2">
                {project.assignedTo.slice(0, 3).map(user => (
                  <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                    <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                    <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {renderDateBadge()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KanbanCard;