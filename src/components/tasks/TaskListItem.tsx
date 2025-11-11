import React from 'react';
import { Task, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { cn, getAvatarUrl, generatePastelColor, getInitials, formatActivityDescription } from '@/lib/utils';
import { CheckCircle, Circle } from 'lucide-react';
import { Button } from '../ui/button';

interface TaskListItemProps {
  task: Task;
  onClick: (task: Task) => void;
  onToggleCompletion: (task: Task, completed: boolean) => void;
  isUnread: boolean;
  currentUserId?: string;
}

const TaskListItem: React.FC<TaskListItemProps> = ({ task, onClick, onToggleCompletion, isUnread, currentUserId }) => {
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  let dueDateText = '';
  let dueDateColor = 'text-muted-foreground';

  if (dueDate) {
    if (isToday(dueDate)) {
      dueDateText = 'Today';
      dueDateColor = 'text-primary';
    } else if (isTomorrow(dueDate)) {
      dueDateText = 'Tomorrow';
    } else if (isPast(dueDate)) {
      const daysOverdue = differenceInDays(new Date(), dueDate);
      dueDateText = `${daysOverdue}d ago`;
      dueDateColor = 'text-destructive';
    } else {
      dueDateText = format(dueDate, 'MMM d');
    }
  }

  const isAssignedToCurrentUser = React.useMemo(() => {
    if (!currentUserId) return false;
    return task.assignedTo?.some(assignee => assignee.id === currentUserId);
  }, [task.assignedTo, currentUserId]);

  const isUrgent = task.priority?.toLowerCase() === 'urgent';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleCompletion(task, !task.completed);
  };

  return (
    <div
      className={cn(
        "flex items-start space-x-3 p-3 rounded-md hover:bg-muted group transition-colors duration-200 cursor-pointer",
        isUrgent && !task.completed ? "bg-red-500/10" : isAssignedToCurrentUser && !task.completed ? "bg-primary/10" : ""
      )}
      onClick={() => onClick(task)}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className="mt-0.5 h-6 w-6 rounded-full p-0 border-none bg-transparent hover:bg-muted"
      >
        {task.completed ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </Button>
      <div className="flex-1 min-w-0 text-sm">
        <div className="flex items-center gap-2">
          {isUnread && <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />}
          <div className={cn("break-words", task.completed && "line-through text-muted-foreground")}>
            <span dangerouslySetInnerHTML={{ __html: formatActivityDescription(task.title) }} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground truncate">{task.project_name}</p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <div className="flex items-center -space-x-2">
          {task.assignedTo?.slice(0, 3).map((user: User) => (
            <TooltipProvider key={user.id}>
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                    <AvatarFallback style={generatePastelColor(user.id)}>
                      {getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}
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
        {dueDateText && (
          <div className={cn("text-xs font-medium whitespace-nowrap", dueDateColor)}>
            {dueDateText}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskListItem;