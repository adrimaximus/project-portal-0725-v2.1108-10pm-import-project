import { Task } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Flag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { generatePastelColor, getPriorityStyles, isOverdue, cn, getAvatarUrl, getInitials } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Draggable } from '@hello-pangea/dnd';

interface TasksKanbanCardProps {
  task: Task;
  index: number;
  projectSlug: string;
}

const TasksKanbanCard = ({ task, index, projectSlug }: TasksKanbanCardProps) => {
  const priorityStyles = getPriorityStyles(task.priority);
  const overdue = isOverdue(task.due_date);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <Link to={`/projects/${projectSlug}?task=${task.id}`}>
                <p className="font-semibold text-sm mb-2">{task.title}</p>
              </Link>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {task.due_date && (
                    <div className={cn("flex items-center gap-1", { "text-red-500": overdue })}>
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(task.due_date), 'MMM d')}</span>
                    </div>
                  )}
                  {task.priority && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Flag className="h-3 w-3" style={{ color: priorityStyles.hex }} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Priority: {task.priority}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <div className="flex -space-x-2">
                  {task.assignees?.map(user => (
                    <TooltipProvider key={user.id}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={getAvatarUrl(user)} />
                            <AvatarFallback style={generatePastelColor(user.id)}>
                              {getInitials([user.first_name, user.last_name].filter(Boolean).join(' '))}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{[user.first_name, user.last_name].filter(Boolean).join(' ')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

export default TasksKanbanCard;