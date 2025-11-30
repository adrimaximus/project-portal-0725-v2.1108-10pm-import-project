import { useMemo, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Loader2, Clock, CheckCircle2, AlertTriangle, Plus, ArrowRight } from 'lucide-react';
import { Task, User } from '@/types';
import { format, isPast, isToday } from 'date-fns';
import { cn, getInitials, getAvatarUrl, generatePastelColor, getPriorityStyles } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useTaskDrawer } from '@/contexts/TaskDrawerContext';
import { getProjectBySlug } from '@/lib/projectsApi';
import { toast } from 'sonner';
import { ScrollArea } from '../ui/scroll-area';
import InteractiveText from '../InteractiveText';
import { useProfiles } from '@/hooks/useProfiles';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

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
  const isOverdue = dueDate && isPast(dueDate) && !task.completed;
  
  return (
    <div 
      onClick={handleTaskClick}
      className="group flex flex-col gap-2 p-3 rounded-xl hover:bg-accent/40 border border-transparent hover:border-border transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
           <div 
             className={cn(
               "mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-offset-background transition-colors",
               task.completed ? "bg-muted-foreground ring-muted" : 
               task.priority === 'Urgent' ? "bg-red-500 ring-red-200 dark:ring-red-900" :
               task.priority === 'High' ? "bg-orange-500 ring-orange-200 dark:ring-orange-900" :
               "bg-blue-500 ring-blue-200 dark:ring-blue-900"
             )}
           />
           <div className="flex-1 min-w-0 space-y-1">
              <div className={cn("font-medium text-sm leading-tight break-words flex items-center gap-2", task.completed && "line-through text-muted-foreground")}>
                <span className="truncate"><InteractiveText text={task.title} members={allUsers} /></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="truncate max-w-[120px]">{task.project_name}</span>
                {dueDate && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className={cn("flex items-center gap-1", isOverdue ? "text-red-500 font-medium" : "")}>
                      {format(dueDate, 'MMM d')}
                    </span>
                  </>
                )}
              </div>
           </div>
        </div>

        <div className="flex -space-x-2 flex-shrink-0">
          {task.assignedTo?.slice(0, 2).map(user => (
            <TooltipProvider key={user.id}>
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="h-6 w-6 border-2 border-background ring-1 ring-border">
                    <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                    <AvatarFallback className="text-[9px]" style={generatePastelColor(user.id)}>
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
  );
};

const MyTasksWidget = () => {
  const { user } = useAuth();
  const { data: allTasks, isLoading, refetch } = useTasks({ sortConfig: { key: 'due_date', direction: 'asc' } });
  const { toggleTaskCompletion, isToggling, createTasks, isCreatingTasks } = useTaskMutations(refetch);
  const { data: allUsers = [] } = useProfiles();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !user) return;

    try {
      const { data: projectId, error: rpcError } = await supabase.rpc('get_personal_project_id');
      
      if (rpcError) throw rpcError;
      if (!projectId) throw new Error("Could not find your personal task project. Please contact support.");

      createTasks(
        [{ title: newTaskTitle.trim(), project_id: projectId, assignee_ids: [user.id] }],
        {
          onSuccess: () => {
            setNewTaskTitle('');
            toast.success("Quick task added successfully.");
          }
        }
      );
    } catch (error: any) {
      toast.error("Failed to add task.", { description: error.message });
    }
  };

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
  } = useMemo(() => {
    const active = myTasks.filter(t => !t.completed);
    const completed = myTasks.filter(t => t.completed);
    const completedToday = completed.filter(t => t.updated_at && isToday(new Date(t.updated_at))).length;
    
    const upcoming = active.filter(t => t.due_date && !isPast(new Date(t.due_date)));
    const overdue = active.filter(t => t.due_date && isPast(new Date(t.due_date)));
    const noDueDate = active.filter(t => !t.due_date);

    const totalTasks = myTasks.length;
    const totalCompleted = completed.length;
    const completionPercentage = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

    return { 
      activeTasks: active, 
      completedToday, 
      upcomingTasks: upcoming, 
      overdueTasks: overdue, 
      noDueDateTasks: noDueDate,
      completionPercentage,
      totalCompleted,
      totalTasks,
    };
  }, [myTasks]);

  const handleToggleTaskCompletion = (task: Task, completed: boolean) => {
    toggleTaskCompletion({ task, completed });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Input Section */}
      <div className="relative group">
        <Input
          className="pr-12 bg-muted/40 border-transparent focus:bg-background focus:border-input transition-all rounded-xl h-11"
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          disabled={isCreatingTasks}
        />
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={handleAddTask}
          disabled={isCreatingTasks || !newTaskTitle.trim()}
          className="absolute right-1 top-1 h-9 w-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-background/80"
        >
          {isCreatingTasks ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {/* Progress & Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="font-medium text-foreground">Your Progress</span>
          <span>{totalCompleted}/{totalTasks} Completed</span>
        </div>
        <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full" 
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">{completedToday}</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-green-600/70 dark:text-green-400/70">Today</span>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{upcomingTasks.length}</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600/70 dark:text-blue-400/70">Upcoming</span>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col items-center justify-center gap-1">
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">{overdueTasks.length}</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-red-600/70 dark:text-red-400/70">Overdue</span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1 -mx-4 px-4 h-[300px]">
        <div className="space-y-1 pb-4">
          {overdueTasks.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-red-500 mb-2 px-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Overdue
              </h4>
              <div className="space-y-1">
                {overdueTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTaskCompletion} isToggling={isToggling} allUsers={allUsers} />)}
              </div>
            </div>
          )}
          
          {upcomingTasks.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">Upcoming</h4>
              <div className="space-y-1">
                {upcomingTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTaskCompletion} isToggling={isToggling} allUsers={allUsers} />)}
              </div>
            </div>
          )}

          {noDueDateTasks.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">No Date</h4>
              <div className="space-y-1">
                {noDueDateTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTaskCompletion} isToggling={isToggling} allUsers={allUsers} />)}
              </div>
            </div>
          )}

          {myTasks.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="pt-2 border-t mt-auto">
        <Button variant="ghost" className="w-full justify-between hover:bg-transparent group px-2" asChild>
          <Link to={`/projects?view=tasks&member=${user?.id}`}>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">View all tasks</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default MyTasksWidget;