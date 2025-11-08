import { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Loader2, Clock, CheckCircle2, CheckCircle, AlertTriangle, PlusSquare } from 'lucide-react';
import { Task, UpsertTaskPayload, Project } from '@/types';
import { format, isPast } from 'date-fns';
import { cn, getInitials, getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TaskReactions from '@/components/projects/TaskReactions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useTaskModal } from '@/contexts/TaskModalContext';

const MyTasksWidget = () => {
  const { user } = useAuth();
  const { data: allTasks = [], isLoading, refetch } = useTasks({
    sortConfig: { key: 'due_date', direction: 'asc' },
  });
  const { onOpen: onOpenTaskModal } = useTaskModal();

  const [filter, setFilter] = useState<'upcoming' | 'overdue'>('upcoming');

  const { toggleTaskReaction } = useTaskMutations(refetch);

  const allMyAssignedTasks = useMemo(() => allTasks.filter(task => 
    task.assignedTo?.some(assignee => assignee.id === user?.id)
  ), [allTasks, user]);

  const completedMyTasks = useMemo(() => 
    allMyAssignedTasks.filter(task => task.completed),
    [allMyAssignedTasks]
  );

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

  const completionRate = useMemo(() => 
    allMyAssignedTasks.length > 0 
      ? (completedMyTasks.length / allMyAssignedTasks.length) * 100 
      : 0,
    [allMyAssignedTasks, completedMyTasks]
  );

  const completedOnTimeCount = useMemo(() => 
    completedMyTasks.filter(task => 
      task.due_date && task.updated_at && new Date(task.updated_at) <= new Date(task.due_date)
    ).length,
    [completedMyTasks]
  );

  const myCreatedTasks = useMemo(() => 
    allTasks.filter(task => task.created_by?.id === user?.id),
    [allTasks, user]
  );

  const completedCreatedTasks = useMemo(() =>
    myCreatedTasks.filter(task => task.completed),
    [myCreatedTasks]
  );

  const onTimeRate = completedMyTasks.length > 0 ? (completedOnTimeCount / completedMyTasks.length) * 100 : 0;
  const createdCompletionRate = myCreatedTasks.length > 0 ? (completedCreatedTasks.length / myCreatedTasks.length) * 100 : 0;

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

  const handleToggleReaction = (taskId: string, emoji: string) => {
    toggleTaskReaction({ taskId, emoji });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <CardTitle className="flex items-center">
              My Tasks
            </CardTitle>
            {!isLoading && allMyAssignedTasks.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-default">
                      <Progress value={completionRate} className="w-16 h-1.5" />
                      <span className="text-sm font-medium text-muted-foreground">{completionRate.toFixed(0)}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-2 text-sm">
                      <p className="font-bold">Task Productivity</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p><strong>{onTimeRate.toFixed(0)}%</strong> On-Time Completion</p>
                          <p className="text-xs text-muted-foreground">{completedOnTimeCount} of {completedMyTasks.length} completed tasks</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <div>
                          <p><strong>{overdueCount}</strong> Overdue Task(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PlusSquare className="h-4 w-4 text-blue-500" />
                        <div>
                          <p><strong>{createdCompletionRate.toFixed(0)}%</strong> Created Tasks Completed</p>
                          <p className="text-xs text-muted-foreground">{completedCreatedTasks.length} of {myCreatedTasks.length} created tasks</p>
                        </div>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {!isLoading && upcomingCount > 0 && (
              <Badge 
                variant={filter === 'upcoming' ? 'secondary' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('upcoming')}
              >
                {upcomingCount} Upcoming
              </Badge>
            )}
            {!isLoading && overdueCount > 0 && (
              <Badge 
                variant={filter === 'overdue' ? 'destructive' : 'outline'}
                className={cn("cursor-pointer", filter !== 'overdue' && "text-destructive")}
                onClick={() => setFilter('overdue')}
              >
                {overdueCount} Overdue
              </Badge>
            )}
          </div>
          <Button asChild variant="link" className="text-sm -my-2 -mr-4 self-end sm:self-auto">
            <Link to="/projects?view=tasks">View all</Link>
          </Button>
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
            <div className="divide-y divide-border -mx-6 -mb-6">
              {displayedTasks.map(task => {
                const avatarUser = task.created_by;

                return (
                  <div 
                    key={task.id} 
                    role="button"
                    tabIndex={0}
                    className="flex w-full items-center gap-3 px-6 py-2.5 transition-colors hover:bg-muted/50 text-left cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTaskClick(task) }}
                  >
                    <div className="flex-grow min-w-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-medium leading-tight text-sm truncate">
                              {task.title}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{task.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.project_name}</p>
                    </div>
                    <div className="flex items-center flex-wrap justify-end gap-x-3 gap-y-1 shrink-0 ml-auto">
                      {task.due_date && (
                        <div className={cn(
                          "text-xs font-medium whitespace-nowrap flex items-center gap-1.5",
                          isPast(new Date(task.due_date)) ? "text-destructive" : "text-muted-foreground"
                        )}>
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(task.due_date), 'MMM d')}</span>
                        </div>
                      )}
                      <TaskReactions
                        reactions={task.reactions || []}
                        onToggleReaction={(emoji) => handleToggleReaction(task.id, emoji)}
                      />
                      {avatarUser && (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={getAvatarUrl(avatarUser.avatar_url, avatarUser.id)} alt={avatarUser.name || ''} />
                          <AvatarFallback style={generatePastelColor(avatarUser.id)} className="text-xs">
                            {getInitials(avatarUser.name, avatarUser.email)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default MyTasksWidget;