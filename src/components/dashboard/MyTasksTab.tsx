import { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Loader2, Clock, CheckCircle2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Task } from '@/types';
import { format, isPast } from 'date-fns';
import { cn, getInitials, getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTaskModal } from '@/contexts/TaskModalContext';

const MyTasksTab = () => {
  const { data: tasksData, isLoading: isLoadingTasks } = useTasks({ fetchAll: true });
  const { user } = useAuth();
  const { openTaskModal } = useTaskModal();
  const { updateTaskMutation } = useTaskMutations();
  const [showCompleted, setShowCompleted] = useState(false);

  const myTasks = useMemo(() => {
    if (!tasksData || !user) return [];
    const allTasks = tasksData.pages.flatMap(page => page.tasks);
    return allTasks.filter(task => 
      task.assignedTo?.some(assignee => assignee.id === user.id)
    );
  }, [tasksData, user]);

  const sortedTasks = useMemo(() => {
    return myTasks
      .filter(task => showCompleted || !task.completed)
      .sort((a, b) => {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [myTasks, showCompleted]);

  const handleToggleComplete = (task: Task) => {
    updateTaskMutation.mutate({
      ...task,
      completed: !task.completed,
    });
  };

  if (isLoadingTasks) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const priorityStyles = {
    urgent: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    normal: 'bg-blue-100 text-blue-800 border-blue-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setShowCompleted(!showCompleted)}>
          {showCompleted ? 'Hide Completed' : 'Show Completed'}
        </Button>
      </div>
      {sortedTasks.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <CheckCircle2 className="mx-auto h-12 w-12" />
          <p className="mt-4">All caught up! You have no pending tasks.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
          {sortedTasks.map(task => {
            const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !task.completed;
            return (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full"
                        onClick={() => handleToggleComplete(task)}
                      >
                        <CheckCircle className={cn("h-5 w-5 text-muted-foreground transition-colors", task.completed && "text-green-500")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{task.completed ? 'Mark as incomplete' : 'Mark as complete'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex-1">
                  <button onClick={() => openTaskModal(task.id, task.project_slug)} className="text-left w-full">
                    <p className={cn("font-medium", task.completed && "line-through text-muted-foreground")}>
                      {task.title}
                    </p>
                  </button>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Link to={`/projects/${task.project_slug}`} className="hover:underline">{task.project_name}</Link>
                    <span className="text-gray-300">•</span>
                    {task.due_date && (
                      <div className={cn("flex items-center gap-1", isOverdue && "text-red-500 font-medium")}>
                        {isOverdue && <AlertTriangle className="h-3 w-3" />}
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(task.due_date), 'MMM d')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {task.priority && (
                    <Badge variant="outline" className={cn("capitalize text-xs", priorityStyles[task.priority as keyof typeof priorityStyles])}>
                      {task.priority}
                    </Badge>
                  )}
                  <div className="flex -space-x-2">
                    {task.assignedTo?.map(assignee => (
                      <TooltipProvider key={assignee.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar className="h-6 w-6 border-2 border-background">
                              <AvatarImage src={getAvatarUrl(assignee.avatar_url, assignee.id)} />
                              <AvatarFallback style={generatePastelColor(assignee.id)}>{assignee.initials}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{assignee.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTasksTab;