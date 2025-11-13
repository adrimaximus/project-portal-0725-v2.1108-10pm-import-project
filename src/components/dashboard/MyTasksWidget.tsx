import { useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Loader2, Clock, CheckCircle2, AlertTriangle, ListChecks } from 'lucide-react';
import { Task, User } from '@/types';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { cn, getInitials, getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTaskDrawer } from '@/contexts/TaskDrawerContext';
import { getProjectBySlug } from '@/lib/projectsApi';
import { toast } from 'sonner';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import InteractiveText from '../InteractiveText';
import { useProfiles } from '@/hooks/useProfiles';
import TaskStatusChart from './TaskStatusChart';

const TaskItem = ({ task, onToggle, isToggling, allUsers }: { task: Task, onToggle: (task: Task, completed: boolean) => void, isToggling: boolean, allUsers: User[] }) => {
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
    } else if (isPast(dueDate) && !task.completed) {
      const daysOverdue = differenceInDays(new Date(), dueDate);
      dueDateText = `${daysOverdue}d ago`;
      dueDateColor = 'text-destructive';
    } else {
      dueDateText = format(dueDate, 'MMM d');
    }
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer" onClick={handleTaskClick}>
      <Checkbox
        id={`task-dash-${task.id}`}
        checked={task.completed}
        onCheckedChange={(checked) => onToggle(task, !!checked)}
        className="mt-1"
        onClick={(e) => e.stopPropagation()}
        disabled={isToggling}
      />
      <div className="flex-1 min-w-0">
        <div className={cn("font-medium text-sm", task.completed && "line-through text-muted-foreground")}>
          <InteractiveText text={task.title} members={allUsers} />
        </div>
        <p className="text-xs text-muted-foreground truncate">{task.project_name}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {dueDateText && <span className={`text-xs font-medium ${dueDateColor}`}>{dueDateText}</span>}
        <div className="flex -space-x-2">
          {task.assignedTo?.slice(0, 3).map(user => (
            <TooltipProvider key={user.id}>
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                    <AvatarFallback style={generatePastelColor(user.id)}>{getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}</AvatarFallback>
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
  const { data: allTasks, isLoading, refetch } = useTasks({ sortConfig: { key: 'due_date', direction: 'asc' } });
  const { toggleTaskCompletion, isToggling } = useTaskMutations(refetch);
  const { data: allUsers = [] } = useProfiles();

  const myTasks = useMemo(() => {
    if (!user || !allTasks) return [];
    return allTasks.filter(task => task.assignedTo?.some(assignee => assignee.id === user.id));
  }, [allTasks, user]);

  const {
    upcomingTasks,
    overdueTasks,
    noDueDateTasks,
  } = useMemo(() => {
    const active = myTasks.filter(t => !t.completed);
    const upcoming = active.filter(t => t.due_date && !isPast(new Date(t.due_date)));
    const overdue = active.filter(t => t.due_date && isPast(new Date(t.due_date)));
    const noDueDate = active.filter(t => !t.due_date);
    return { upcomingTasks: upcoming, overdueTasks: overdue, noDueDateTasks: noDueDate };
  }, [myTasks]);

  const handleToggleTaskCompletion = (task: Task, completed: boolean) => {
    toggleTaskCompletion({ task, completed });
  };

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-1">
        <TaskStatusChart tasks={myTasks} />
      </div>
      <div className="md:col-span-1">
        <ScrollArea className="h-48 pr-2">
          <div className="space-y-4">
            {overdueTasks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Overdue</h4>
                <div className="space-y-1">
                  {overdueTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTaskCompletion} isToggling={isToggling} allUsers={allUsers} />)}
                </div>
              </div>
            )}
            {upcomingTasks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Upcoming</h4>
                <div className="space-y-1">
                  {upcomingTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTaskCompletion} isToggling={isToggling} allUsers={allUsers} />)}
                </div>
              </div>
            )}
            {noDueDateTasks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">No Due Date</h4>
                <div className="space-y-1">
                  {noDueDateTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTaskCompletion} isToggling={isToggling} allUsers={allUsers} />)}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default MyTasksWidget;