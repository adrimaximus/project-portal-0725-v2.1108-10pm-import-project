import { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Loader2, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Task, Project } from '@/types';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTaskModal } from '@/contexts/TaskModalContext';

const MyTasksWidget = () => {
  const { user } = useAuth();
  const { data: allTasks = [], isLoading } = useTasks({
    sortConfig: { key: 'due_date', direction: 'asc' },
  });
  const { onOpen: onOpenTaskModal } = useTaskModal();
  const [filter, setFilter] = useState<'upcoming' | 'overdue'>('upcoming');

  const allMyAssignedTasks = useMemo(() => allTasks.filter(task => 
    task.assignedTo?.some(assignee => assignee.id === user?.id)
  ), [allTasks, user]);

  const incompleteMyTasks = useMemo(() =>
    allMyAssignedTasks.filter(task => !task.completed),
    [allMyAssignedTasks]
  );

  const overdueTasks = useMemo(() => 
    incompleteMyTasks.filter(task => task.due_date && isPast(new Date(task.due_date))),
    [incompleteMyTasks]
  );

  const upcomingTasks = useMemo(() => 
    incompleteMyTasks.filter(task => !task.due_date || !isPast(new Date(task.due_date))),
    [incompleteMyTasks]
  );

  const overdueCount = overdueTasks.length;
  const upcomingCount = upcomingTasks.length;

  const displayedTasks = useMemo(() => {
    const tasksToDisplay = filter === 'overdue' ? overdueTasks : upcomingTasks;
    return tasksToDisplay.slice(0, 5);
  }, [upcomingTasks, overdueTasks, filter]);

  const handleTaskClick = (task: Task) => {
    const projectForTask = {
      id: task.project_id,
      name: task.project_name,
      slug: task.project_slug,
    } as Project;
    onOpenTaskModal(task, undefined, projectForTask);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
        <CardTitle className="text-base font-medium">My Tasks</CardTitle>
        <div className="flex items-center gap-x-3 gap-y-2">
          {upcomingCount > 0 && (
            <Badge 
              variant={filter === 'upcoming' ? 'secondary' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter('upcoming')}
            >
              {upcomingCount} Upcoming
            </Badge>
          )}
          {overdueCount > 0 && (
            <Badge 
              variant={filter === 'overdue' ? 'destructive' : 'outline'}
              className={cn("cursor-pointer", filter !== 'overdue' && "text-destructive")}
              onClick={() => setFilter('overdue')}
            >
              {overdueCount} Overdue
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : displayedTasks.length === 0 ? (
          <div className="text-center py-10">
            <div className="mx-auto h-12 w-12 text-green-500 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {filter === 'overdue' ? 'No overdue tasks!' : 'All caught up!'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === 'overdue' ? 'You have no overdue tasks. Keep it up!' : 'You have no upcoming tasks.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border -mx-6">
            {displayedTasks.map(task => (
              <div 
                key={task.id} 
                role="button"
                tabIndex={0}
                className="flex w-full items-center gap-3 px-6 py-2.5 transition-colors hover:bg-muted/50 text-left cursor-pointer"
                onClick={() => handleTaskClick(task)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTaskClick(task) }}
              >
                <div className="flex-grow min-w-0">
                  <p className="font-medium leading-tight text-sm truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.project_name}</p>
                </div>
                {task.due_date && (
                  <div className={cn(
                    "text-xs font-medium whitespace-nowrap flex items-center gap-1.5",
                    isPast(new Date(task.due_date)) ? "text-destructive" : "text-muted-foreground"
                  )}>
                    <Clock className="h-3 w-3" />
                    <span>{format(new Date(task.due_date), 'MMM d')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyTasksWidget;