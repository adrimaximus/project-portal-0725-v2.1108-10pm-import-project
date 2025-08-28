import { Task, TaskAssignee } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { generateVibrantGradient, getPriorityStyles } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Ticket } from 'lucide-react';
import { format } from 'date-fns';

interface TasksKanbanCardProps {
  task: Task;
}

const getInitials = (user: TaskAssignee) => {
    const firstNameInitial = user.first_name?.[0] || '';
    const lastNameInitial = user.last_name?.[0] || '';
    if (firstNameInitial && lastNameInitial) {
        return `${firstNameInitial}${lastNameInitial}`.toUpperCase();
    }
    return (user.email?.[0] || 'U').toUpperCase();
}

const TasksKanbanCard = ({ task }: TasksKanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityStyle = getPriorityStyles(task.priority);

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="mb-4 touch-none bg-card border-l-4 cursor-grab active:cursor-grabbing"
      // @ts-ignore
      style={{ ...style, borderLeftColor: priorityStyle.color }}
    >
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium leading-snug">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
          {task.projects ? (
            <Link to={`/projects/${task.projects.slug}`} className="hover:underline text-primary truncate max-w-[120px]">
              {task.projects.name}
            </Link>
          ) : <span>&nbsp;</span>}
          <Badge variant="outline" className={priorityStyle.tw}>{task.priority || 'Low'}</Badge>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center -space-x-2">
            {(task.assignees && task.assignees.length > 0)
              ? task.assignees.map((user) => (
                <TooltipProvider key={user.id}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback style={generateVibrantGradient(user.id)}>
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{[user.first_name, user.last_name].filter(Boolean).join(' ')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))
              : <div className="h-6 w-6" />
            }
          </div>
          <div className="text-xs text-muted-foreground">
            {task.due_date ? format(new Date(task.due_date), "MMM d") : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TasksKanbanCard;