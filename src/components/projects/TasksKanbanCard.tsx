import { Task } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { generatePastelColor, getPriorityStyles, isOverdue, cn, getAvatarUrl, getInitials } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useDraggable } from '@dnd-kit/core';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle,
  MoreHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';

interface TasksKanbanCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const priorityIcons = {
  low: <ArrowDown className="h-4 w-4 text-gray-500" />,
  normal: <CheckCircle className="h-4 w-4 text-yellow-500" />,
  high: <ArrowUp className="h-4 w-4 text-red-500" />,
};

export function TasksKanbanCard({ task, onEdit, onDelete }: TasksKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { task },
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
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <p className="font-semibold text-sm mb-2">{task.title}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEdit(task)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-500"
                onClick={() => onDelete(task.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Link to={`/projects/${task.project_slug}`}>
          <Badge variant="outline">{task.project_name}</Badge>
        </Link>
        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  {priorityIcons[task.priority as keyof typeof priorityIcons] || null}
                </TooltipTrigger>
                <TooltipContent>{task.priority} priority</TooltipContent>
              </Tooltip>
              {task.due_date && (
                <Tooltip>
                  <TooltipTrigger>
                    <div className={cn("flex items-center gap-1 text-xs", isOverdue(task.due_date) && "text-red-500")}>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(new Date(task.due_date), "MMM d")}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Due: {format(new Date(task.due_date), "PPP")}</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
          <div className="flex items-center -space-x-2">
            <TooltipProvider>
              {task.assignees.map((user) => (
                <Tooltip key={user.id}>
                  <TooltipTrigger>
                    <Avatar className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={getAvatarUrl(user.avatar_url) || undefined} />
                      <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>
                        {getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>{[user.first_name, user.last_name].filter(Boolean).join(' ')}</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}