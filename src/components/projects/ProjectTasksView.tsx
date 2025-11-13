import { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { Task, UpsertTaskPayload, User } from '@/types';
import { Loader2 } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import TaskDetailCard from '@/components/projects/TaskDetailCard';
import TaskFormDialog from '@/components/projects/TaskFormDialog';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getAvatarUrl, generatePastelColor, getInitials } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useProfiles } from '@/hooks/useProfiles';
import InteractiveText from '../InteractiveText';
import { Checkbox } from '../ui/checkbox';

const TaskListItem = ({ task, onToggleTaskCompletion, onTaskClick, isUnread, allUsers, isToggling }: { task: Task, onToggleTaskCompletion: (task: Task, completed: boolean) => void, onTaskClick: (task: Task) => void, isUnread: boolean, allUsers: User[], isToggling: boolean }) => {
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  let dueDateText = '';
  let dueDateColor = 'text-muted-foreground';

  if (dueDate) {
    if (isPast(dueDate) && !task.completed) {
      dueDateText = format(dueDate, 'MMM d, p');
      dueDateColor = 'text-destructive';
    } else {
      dueDateText = format(dueDate, 'MMM d, p');
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 border-b" onClick={() => onTaskClick(task)}>
      <Checkbox
        id={`task-mobile-${task.id}`}
        checked={task.completed}
        onCheckedChange={(checked) => onToggleTaskCompletion(task, !!checked)}
        className="mt-1"
        onClick={(e) => e.stopPropagation()}
        disabled={isToggling}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isUnread && <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />}
          <div className={cn("font-medium", task.completed && "line-through text-muted-foreground")}>
            <InteractiveText text={task.title} members={allUsers} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{task.project_name}</p>
        <div className="flex items-center gap-4 mt-2">
          {dueDateText && <span className={`text-xs font-medium ${dueDateColor}`}>{dueDateText}</span>}
          <div className="flex -space-x-2">
            {task.assignedTo?.slice(0, 3).map(user => (
              <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} />
                <AvatarFallback style={generatePastelColor(user.id)}>{getInitials([user.first_name, user.last_name].filter(Boolean).join(' '), user.email || undefined)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


const ProjectTasksView = () => {
  const { data: tasks = [], isLoading, refetch } = useTasks({ sortConfig: { key: 'created_at', direction: 'desc' } });
  const { data: allUsers = [] } = useProfiles();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const { upsertTask, isUpserting, deleteTask, toggleTaskCompletion, isToggling } = useTaskMutations(refetch);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(null);
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setSelectedTask(null);
    setTaskToDelete(task);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id, {
        onSuccess: () => {
          toast.success(`Task deleted.`);
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

  const handleToggleTaskCompletion = (task: Task, completed: boolean) => {
    toggleTaskCompletion({ task, completed });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <div className="divide-y divide-border">
          {tasks.map(task => (
            <TaskListItem key={task.id} task={task} onToggleTaskCompletion={handleToggleTaskCompletion} onTaskClick={handleTaskClick} isUnread={false} allUsers={allUsers} isToggling={isToggling} />
          ))}
        </div>
      </div>

      <Dialog open={!!selectedTask} onOpenChange={(isOpen) => !isOpen && setSelectedTask(null)}>
        {selectedTask && (
          <TaskDetailCard
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
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

export default ProjectTasksView;