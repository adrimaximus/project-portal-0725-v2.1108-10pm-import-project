import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Task, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getAvatarUrl, generatePastelColor, getInitials, truncateText } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { format } from 'date-fns';
import { Tag } from 'lucide-react';

interface TasksKanbanCardProps {
  task: Task;
  index: number;
  onClick: () => void;
}

const priorityColors: { [key: string]: string } = {
  'Low': 'bg-green-500',
  'Medium': 'bg-yellow-500',
  'High': 'bg-red-500',
};

const TasksKanbanCard: React.FC<TasksKanbanCardProps> = ({ task, index, onClick }) => {
  const assignedTo = task.assigned_to as User[];

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-card p-3 rounded-lg shadow-sm border border-border/50 mb-3 cursor-pointer hover:bg-accent transition-colors"
          onClick={onClick}
        >
          <div className="flex justify-between items-start">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h4 className="font-semibold text-sm mb-2 break-words">{truncateText(task.title, 60)}</h4>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{task.title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {task.priority && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className={`w-3 h-3 rounded-full ${priorityColors[task.priority]}`}></div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{task.priority} Priority</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {task.description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground mb-3">{truncateText(task.description, 100)}</p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{task.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center -space-x-2">
              {assignedTo.slice(0, 3).map((user) => {
                const userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;
                return (
                  <TooltipProvider key={user.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="h-6 w-6 border-2 border-card">
                          <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                          <AvatarFallback style={generatePastelColor(user.id)}>
                            {getInitials(userName, user.email)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{userName}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
              {assignedTo.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold border-2 border-card">
                  +{assignedTo.length - 3}
                </div>
              )}
            </div>
            {task.due_date && (
              <div className="text-xs text-muted-foreground">
                {format(new Date(task.due_date), 'MMM d')}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default TasksKanbanCard;