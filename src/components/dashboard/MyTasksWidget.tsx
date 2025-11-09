import { useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Task } from '@/types';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl, generatePastelColor, getInitials } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTaskDrawer } from '@/contexts/TaskDrawerContext';
import { getProjectBySlug } from '@/lib/projectsApi';

const TaskItem = ({ task }: { task: Task }) => {
  const { onOpen: onOpenTaskDrawer } = useTaskDrawer();

  const handleTaskClick = async () => {
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

  return (
    <div 
      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
      onClick={handleTaskClick}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.title}</p>
        <p className="text-xs text-muted-foreground truncate">{task.project_name}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {dueDateText && <span className={`text-xs font-medium ${dueDateColor}`}>{dueDateText}</span>}
        <div className="flex -space-x-2">
          {task.assignedTo?.slice(0, 2).map(user => (
            <TooltipProvider key={user.id}>
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                    <AvatarFallback style={generatePastelColor(user.id)}>{getInitials(user.name, user.email)}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent><p>{user.name}</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    </div>
  );
};

const MyTasksWidget = () => {
  const { user } = useAuth();
  const { data: allTasks, isLoading } = useTasks({ sortConfig: { key: 'due_date', direction: 'asc' } });

  const myTasks = useMemo(() => {
    if (!user || !allTasks) return [];
    return allTasks.filter(task => task.assignedTo?.some(assignee => assignee.id === user.id));
  }, [allTasks, user]);

  const {
    activeTasks,
    completedToday,
    upcomingTasks,
    overdueTasks,
    completionPercentage,
  } = useMemo(() => {
    const active = myTasks.filter(t => !t.completed);
    const completed = myTasks.filter(t => t.completed);
    const today = new Date();
    const completedToday = completed.filter(t => t.updated_at && isToday(new Date(t.updated_at))).length;
    
    const upcoming = active.filter(t => t.due_date && !isPast(new Date(t.due_date)));
    const overdue = active.filter(t => t.due_date && isPast(new Date(t.due_date)));

    const totalTasks = myTasks.length;
    const completionPercentage = totalTasks > 0 ? (completed.length / totalTasks) * 100 : 0;

    return { activeTasks: active, completedToday, upcomingTasks: upcoming, overdueTasks: overdue, completionPercentage };
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
      <div className="flex items-center gap-4">
        <Progress value={completionPercentage} className="flex-1" />
        <span className="text-sm font-semibold">{completionPercentage.toFixed(0)}%</span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
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
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
        {overdueTasks.map(task => <TaskItem key={task.id} task={task} />)}
        {upcomingTasks.map(task => <TaskItem key={task.id} task={task} />)}
      </div>
    </div>
  );
};

export default MyTasksWidget;