import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, User } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, generatePastelColor, getAvatarUrl, getInitials, truncateText } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { format } from 'date-fns';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface TasksKanbanCardProps {
  task: Task;
  onTaskClick: (task: Task) => void;
}

const priorityColors: { [key: string]: string } = {
  'Urgent': 'bg-red-500',
  'High': 'bg-orange-500',
  'Normal': 'bg-yellow-500',
  'Low': 'bg-green-500',
};

const TasksKanbanCard: React.FC<TasksKanbanCardProps> = ({ task, onTaskClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: task.id,
    data: {
      type: 'Task',
      task,
    }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = () => {
    onTaskClick(task);
  };

  const assignedTo = task.assignedTo || [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("mb-3 cursor-grab active:cursor-grabbing", isDragging && "opacity-30")}
    >
      <Card className="hover:shadow-md transition-shadow" onClick={handleClick}>
        <CardContent className="p-3">
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
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>{tag.name}</Badge>
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
                            {getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}
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
            <div className="flex items-center gap-2">
              {task.due_date && (
                <div className="text-xs text-muted-foreground">
                  {format(new Date(task.due_date), 'MMM d')}
                </div>
              )}
              {task.priority && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className={`w-3 h-3 rounded-full ${priorityColors[task.priority] || 'bg-gray-400'}`}></div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{task.priority} Priority</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TasksKanbanCard;