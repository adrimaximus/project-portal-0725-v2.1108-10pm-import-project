import { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Loader2, Clock, CheckCircle2, CheckCircle, AlertTriangle, PlusSquare } from 'lucide-react';
import { Task, UpsertTaskPayload } from '@/types';
import { format, isPast } from 'date-fns';
import { cn, getInitials, getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Drawer } from '@/components/ui/drawer';
import TaskDetailCard from '@/components/projects/TaskDetailCard';
import TaskFormDialog from '@/components/projects/TaskFormDialog';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TaskReactions from '@/components/projects/TaskReactions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

const MyTasksWidget = () => {
  const { user } = useAuth();
  const { data: allTasks = [], isLoading, refetch } = useTasks({
    sortConfig: { key: 'due_date', direction: 'asc' },
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'overdue'>('upcoming');

  const { upsertTask, isUpserting, deleteTask, toggleTaskReaction } = useTaskMutations(refetch);

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
    setSelectedTask(task);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(null); // Close the detail view
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setSelectedTask(null); // Close the detail view
    setTaskToDelete(task);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id, {
        onSuccess: () => {
          toast.success(`Task "${taskToDelete.title}" deleted.`);
          setTaskToDelete(null);
        },
      });
    }
  };

  const handleTaskFormSubmit = (data: UpsertTaskPayload) => {
    upsertTask(data, {
      onSuccess: () => {
        setIsTaskFormOpen(false);
        setEditingTask(null);
      },
    });
  };

  const handleToggleReaction = (taskId: string, emoji: string) => {
    toggleTaskReaction({ taskId, emoji });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
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
          <Button asChild variant="link" className="text-sm -my-2 -mr-4">
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
                    <div className="flex-grow">
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
                      <p className="text-xs text-muted-foreground mt-0.5">{task.project_name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-auto">
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

      <Drawer open={!!selectedTask} onOpenChange={(isOpen) => !isOpen && setSelectedTask(null)}>
        {selectedTask && (
          <TaskDetailCard
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onEdit={handleEditTask}
            onDelete={() => handleDeleteTask(selectedTask)}
          />
        )}
      </Drawer>

      <TaskFormDialog
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        onSubmit={handleTaskFormSubmit}
        isSubmitting={isUpserting}
        task={editingTask}
      />

      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Are you sure you want to delete this task?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyTasksWidget;