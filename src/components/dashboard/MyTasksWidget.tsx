import { useMemo, useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Plus, ArrowRight, Calendar, Clock } from 'lucide-react';
import { isPast, isToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { toast } from 'sonner';
import { ScrollArea } from '../ui/scroll-area';
import { useProfiles } from '@/hooks/useProfiles';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import TaskItem from '../TaskItem';

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
    tasksDueToday,
    upcomingTasks,
    overdueTasks,
    noDueDateTasks,
    completionPercentage,
    totalCompleted,
    totalTasks,
  } = useMemo(() => {
    const active = myTasks.filter(t => !t.completed);
    const completed = myTasks.filter(t => t.completed);
    
    const tasksDueToday = active.filter(t => t.due_date && isToday(new Date(t.due_date)));
    const overdue = active.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));
    const upcoming = active.filter(t => t.due_date && !isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));
    const noDueDate = active.filter(t => !t.due_date);

    const totalTasks = myTasks.length;
    const totalCompleted = completed.length;
    const completionPercentage = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;

    return { 
      tasksDueToday, 
      upcomingTasks: upcoming, 
      overdueTasks: overdue, 
      noDueDateTasks: noDueDate,
      completionPercentage,
      totalCompleted,
      totalTasks,
    };
  }, [myTasks]);

  const handleToggleTaskCompletion = (task: any, completed: boolean) => {
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
    <div className="flex flex-col h-full gap-4">
      {/* Input Section & Stats - Fixed at top */}
      <div className="flex flex-col gap-4 shrink-0">
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

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex flex-col items-center justify-center gap-0.5 transition-transform hover:scale-[1.02]">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{tasksDueToday.length}</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-600/70 dark:text-emerald-400/70">Today</span>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 flex flex-col items-center justify-center gap-0.5 transition-transform hover:scale-[1.02]">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{upcomingTasks.length}</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-blue-600/70 dark:text-blue-400/70">Upcoming</span>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 flex flex-col items-center justify-center gap-0.5 transition-transform hover:scale-[1.02]">
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{overdueTasks.length}</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-rose-600/70 dark:text-rose-400/70">Overdue</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="font-medium text-foreground">Completion Rate</span>
            <span>{Math.round(completionPercentage)}%</span>
          </div>
          <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Categorized Task List - Auto height with max height */}
      <ScrollArea className="-mx-4 px-4 h-auto max-h-[500px]">
        <div className="space-y-6 pb-2">
          
          {/* TODAY Section */}
          <div>
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1">
              <h4 className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Calendar className="h-3.5 w-3.5" /> Due Today
                <Badge variant="secondary" className="ml-auto text-[10px] h-5 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200/50">{tasksDueToday.length}</Badge>
              </h4>
            </div>
            {tasksDueToday.length > 0 ? (
              <div className="space-y-1">
                {tasksDueToday.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTaskCompletion} isToggling={isToggling} allUsers={allUsers} />)}
              </div>
            ) : (
                <div className="text-center py-4 border border-dashed border-border/60 rounded-xl bg-muted/20">
                    <p className="text-xs text-muted-foreground">No tasks due today.</p>
                </div>
            )}
          </div>

          {/* OVERDUE Section */}
          {overdueTasks.length > 0 && (
            <div>
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1">
                <h4 className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-3.5 w-3.5" /> Overdue
                  <Badge variant="secondary" className="ml-auto text-[10px] h-5 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-200/50">{overdueTasks.length}</Badge>
                </h4>
              </div>
              <div className="space-y-1">
                {overdueTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTaskCompletion} isToggling={isToggling} allUsers={allUsers} />)}
              </div>
            </div>
          )}
          
          {/* UPCOMING Section */}
          {upcomingTasks.length > 0 && (
            <div>
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1">
                <h4 className="flex items-center gap-2 text-xs font-semibold text-blue-500">
                  <Clock className="h-3.5 w-3.5" /> Upcoming
                  <Badge variant="secondary" className="ml-auto text-[10px] h-5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200/50">{upcomingTasks.length}</Badge>
                </h4>
              </div>
              <div className="space-y-1">
                {upcomingTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTaskCompletion} isToggling={isToggling} allUsers={allUsers} />)}
              </div>
            </div>
          )}

          {/* NO DATE Section */}
          {noDueDateTasks.length > 0 && (
            <div>
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 -mx-1 px-1">
                <h4 className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></span> No Date
                  <Badge variant="secondary" className="ml-auto text-[10px] h-5">{noDueDateTasks.length}</Badge>
                </h4>
              </div>
              <div className="space-y-1">
                {noDueDateTasks.map(task => <TaskItem key={task.id} task={task} onToggle={handleToggleTaskCompletion} isToggling={isToggling} allUsers={allUsers} />)}
              </div>
            </div>
          )}

          {myTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer - Fixed at bottom */}
      <div className="pt-2 border-t mt-auto shrink-0">
        <Button variant="ghost" className="w-full justify-between hover:bg-transparent group px-2 h-9" asChild>
          <Link to={`/projects?view=tasks&member=${user?.id}`}>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">View all tasks</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default MyTasksWidget;