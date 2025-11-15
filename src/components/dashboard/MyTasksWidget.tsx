import { useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Loader2, Clock, CheckCircle2, AlertTriangle, ListChecks, PlusSquare, ArrowUp, ArrowDown } from 'lucide-react';
import { Task, User } from '@/types';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { cn, getInitials, getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecentActivityWidget from './RecentActivityWidget';
import CollaboratorsTab from './CollaboratorsTab';
import { useTaskDrawer } from '@/contexts/TaskDrawerContext';
import { getProjectBySlug } from '@/lib/projectsApi';
import { toast } from 'sonner';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '../ui/checkbox';
import InteractiveText from '../InteractiveText';
import { useProfiles } from '@/hooks/useProfiles';

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

  const priorityBorderColor = useMemo(() => {
    switch (task.priority) {
      case 'Urgent':
        return 'border-red-500';
      case 'High':
        return 'border-orange-500';
      case 'Normal':
        return 'border-blue-500';
      case 'Low':
        return 'border-gray-400';
      default:
        return 'border-transparent';
    }
  }, [task.priority]);

  return (
    <div className={cn("flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 border-l-2", priorityBorderColor)}>
      <Checkbox
        id={`task-dash-${task.id}`}
        checked={task.completed}
        onCheckedChange={(checked) => onToggle(task, !!checked)}
        className="mt-1 hidden"
        onClick={(e) => e.stopPropagation()}
        disabled={isToggling}
      />
      <div className="flex flex-wrap justify-between items-center flex-1 gap-2">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={handleTaskClick}>
          <div className={cn("font-medium text-sm", task.completed && "line-through text-muted-foreground")}>
            <InteractiveText text={task.title} members={allUsers} />
          </div>
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
                      <AvatarFallback style={generatePastelColor(user.id)}>
                        {getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent><p>{user.name}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
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
                <h4 className="font-semibold text-sm">Task Productivity</h4>
                <div className="flex items-center gap-3">
                  <ListChecks className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-bold">{completionPercentage.toFixed(0)}% Overall Completion</p>
                    <p className="text-xs text-muted-foreground">{totalCompleted} of {totalTasks} assigned</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-bold">{onTimeCompletionPercentage.toFixed(0)}% On-Time Completion</p>
                    <p className="text-xs text-muted-foreground">{onTimeCompletedCount} of {totalCompleted} completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-bold">{overdueTasks.length} Overdue Task(s)</p>
                    <p className="text-xs text-muted-foreground">{overdueTasks.length} tasks past due</p>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <ScrollArea className="h-48 pr-2">
        <div className="space-y-4">
          {overdueTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Overdue</h4>
              <div className="divide-y divide-border">
                {overdueTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTaskCompletion} isToggling={isToggling} allUsers={allUsers} />)}
              </div>
            </div>
          )}
          {upcomingTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">Upcoming</h4>
              <div className="divide-y divide-border">
                {upcomingTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTaskCompletion} isToggling={isToggling} allUsers={allUsers} />)}
              </div>
            </div>
          )}
          {noDueDateTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-2">No Due Date</h4>
              <div className="divide-y divide-border">
                {noDueDateTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTaskCompletion} isToggling={isToggling} allUsers={allUsers} />)}
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