import { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ListChecks, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { Task, UpsertTaskPayload } from '@/types';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import TaskDetailCard from '@/components/projects/TaskDetailCard';
import TaskFormDialog from '@/components/projects/TaskFormDialog';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const MyTasksWidget = () => {
  const { user } = useAuth();
  const { data: tasks = [], isLoading, refetch } = useTasks({
    hideCompleted: true,
    sortConfig: { key: 'due_date', direction: 'asc' },
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'overdue'>('upcoming');

  const { upsertTask, isUpserting, deleteTask } = useTaskMutations(refetch);

  const allMyTasks = useMemo(() => tasks.filter(task => 
    task.assignedTo?.some(assignee => assignee.id === user?.id)
  ), [tasks, user]);

  const overdueTasks = useMemo(() => 
    allMyTasks.filter(task => task.due_date && isPast(new Date(task.due_date))),
    [allMyTasks]
  );

  const upcomingTasks = useMemo(() => 
    allMyTasks.filter(task => !task.due_date || !isPast(new Date(task.due_date))),
    [allMyTasks]
  );

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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              My Tasks
            </CardTitle>
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
              {displayedTasks.map(task => (
                <button 
                  key={task.id} 
                  className="flex w-full items-center gap-3 px-6 py-2.5 transition-colors hover:bg-muted/50 text-left"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex-grow">
                    <p className="font-medium leading-tight text-sm">
                      {task.title}
                    </p>
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
                    {task.reactions && task.reactions.length > 0 && (
                      <div className="flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                        {task.reactions.slice(0, 2).map((r) => (
                          <span key={r.id}>{r.emoji}</span>
                        ))}
                        {task.reactions.length > 2 && (
                          <span className="font-medium text-muted-foreground">+{task.reactions.length - 2}</span>
                        )}
                      </div>
                    )}
                    {task.created_by && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={task.created_by.avatar_url} alt={task.created_by.first_name || ''} />
                        <AvatarFallback className="text-xs">
                          {((task.created_by.first_name?.[0] || '') + (task.created_by.last_name?.[0] || '')).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTask} onOpenChange={(isOpen) => !isOpen && setSelectedTask(null)}>
        {selectedTask && (
          <TaskDetailCard
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onEdit={handleEditTask}
            onDelete={() => handleDeleteTask(selectedTask)}
          />
        )}
      </Dialog>

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