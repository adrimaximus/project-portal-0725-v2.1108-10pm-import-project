import { useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Clock, CheckCircle2, AlertTriangle, ListChecks } from 'lucide-react';
import { Task } from '@/types';
import { isToday, isPast, isTomorrow } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl, generatePastelColor, getInitials } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTaskDrawer } from '@/contexts/TaskDrawerContext';
import { getProjectBySlug } from '@/lib/projectsApi';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import TaskListItem from '@/components/tasks/TaskListItem';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useUnreadTasks } from '@/hooks/useUnreadTasks';

const MyTasksWidget = () => {
  const { user } = useAuth();
  const { data: allTasks, isLoading, refetch } = useTasks({ sortConfig: { key: 'due_date', direction: 'asc' } });
  const { onOpen: onOpenTaskDrawer } = useTaskDrawer();
  const { toggleTaskCompletion } = useTaskMutations(refetch);
  const { unreadTaskIds } = useUnreadTasks();

  const myTasks = useMemo(() => {
    if (!user || !allTasks) return [];
    return allTasks.filter(task => task.assignedTo?.some(assignee => assignee.id === user.id));
  }, [allTasks, user]);

  const handleTaskClick = async (task: Task) => {
    try {
      const projectForTask = await getProjectBySlug(task.project_slug);
      if (!projectForTask) {
        throw new Error("Project for this task could not be found.");
      }
      onOpenTaskDrawer(task, projectForTask);
    } catch (error) {
      toast.error("Could not open task details.", { description: (error as Error).message });
    }
  };

  const handleToggleCompletion = (task: Task, completed: boolean) => {
    toggleTaskCompletion({ task, completed });
  };

  const {
    activeTasks,
    completedToday,
    upcomingTasks,
    overdueTasks,
    noDueDateTasks,
    completionPercentage,
    totalCompleted,
    totalTasks,
    onTimeCompletionPercentage,
    onTimeCompletedCount,
  } = useMemo(() => {
    const active = myTasks.filter(t => !t.completed);
    const completed = myTasks.filter(t => t.completed);
    const today = new Date();
    const completedToday = completed.filter(t => t.updated_at && isToday(new Date(t.updated_at))).length;
    
    const upcoming = active.filter(t => t.due_date && !isPast(new Date(t.due_date)));
    const overdue = active.filter(t => t.due_date && isPast(new Date(t.due_date)));
    const noDueDate = active.filter(t => !t.due_date);

    const totalTasks = myTasks.length;
    const totalCompleted = completed.length;
    const completionPercentage = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

    const onTimeCompleted = completed.filter(task => {
      if (!task.due_date) return true; // No due date, considered on-time
      if (!task.updated_at) return false; // Should not happen for completed tasks, but for safety
      // Task is on time if completion date is on or before the due date
      return new Date(task.updated_at) <= new Date(task.due_date);
    });
    const onTimeCompletedCount = onTimeCompleted.length;
    const onTimeCompletionPercentage = totalCompleted > 0 ? (onTimeCompletedCount / totalCompleted) * 100 : 0;

    return { 
      activeTasks: active, 
      completedToday, 
      upcomingTasks: upcoming, 
      overdueTasks: overdue, 
      noDueDateTasks: noDueDate,
      completionPercentage,
      totalCompleted,
      totalTasks,
      onTimeCompletionPercentage,
      onTimeCompletedCount,
    };
  }, [myTasks]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (myTasks.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-muted-foreground">You have no assigned tasks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Completed Today</p>
            <p className="text-lg font-bold flex items-center justify-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-500" />{completedToday}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
            <p className="text-lg font-bold flex items-center justify-center gap-1"><Clock className="h-4 w-4 text-blue-500" />{upcomingTasks.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-lg font-bold flex items-center justify-center gap-1"><AlertTriangle className="h-4 w-4 text-red-500" />{overdueTasks.length}</p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-4 w-1/3 cursor-help">
                <Progress value={completionPercentage} className="flex-1" />
                <span className="text-sm font-semibold">{completionPercentage.toFixed(0)}%</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="p-4 bg-background border shadow-lg rounded-lg">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Produktivitas Tugas</h4>
                <div className="flex items-center gap-3">
                  <ListChecks className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-bold">{completionPercentage.toFixed(0)}% Penyelesaian Keseluruhan</p>
                    <p className="text-xs text-muted-foreground">{totalCompleted} dari {totalTasks} tugas yang diberikan</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-bold">{onTimeCompletionPercentage.toFixed(0)}% Penyelesaian Tepat Waktu</p>
                    <p className="text-xs text-muted-foreground">{onTimeCompletedCount} dari {totalCompleted} tugas yang selesai</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-bold">{overdueTasks.length} Tugas Terlambat</p>
                    <p className="text-xs text-muted-foreground">{overdueTasks.length} tugas melewati tenggat</p>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ScrollArea className="h-48 pr-2">
        <div className="space-y-1">
          {overdueTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Overdue</h4>
              <div className="space-y-1">
                {overdueTasks.map(task => <TaskListItem key={task.id} task={task} onClick={handleTaskClick} onToggleCompletion={handleToggleCompletion} isUnread={unreadTaskIds.includes(task.id)} currentUserId={user?.id} />)}
              </div>
            </div>
          )}
          {upcomingTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Upcoming</h4>
              <div className="space-y-1">
                {upcomingTasks.map(task => <TaskListItem key={task.id} task={task} onClick={handleTaskClick} onToggleCompletion={handleToggleCompletion} isUnread={unreadTaskIds.includes(task.id)} currentUserId={user?.id} />)}
              </div>
            </div>
          )}
          {noDueDateTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">No Due Date</h4>
              <div className="space-y-1">
                {noDueDateTasks.map(task => <TaskListItem key={task.id} task={task} onClick={handleTaskClick} onToggleCompletion={handleToggleCompletion} isUnread={unreadTaskIds.includes(task.id)} currentUserId={user?.id} />)}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="pt-2 text-center">
        <Button variant="link" asChild>
          <Link to={`/projects?view=tasks&member=${user?.id}`}>
            View all my tasks
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default MyTasksWidget;