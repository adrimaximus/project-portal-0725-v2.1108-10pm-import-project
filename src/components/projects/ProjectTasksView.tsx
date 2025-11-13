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

const TaskListItem = ({ task, onClick, allUsers }: { task: Task; onClick: (task: Task); allUsers: User[] }) => {
  return (
    <button 
      className="flex w-full items-start gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      onClick={() => onClick(task)}
    >
      <div className="flex-1 space-y-1">
        <p className={cn("text-sm font-medium leading-none", task.completed && "line-through text-muted-foreground")}>
          <InteractiveText text={task.title} members={allUsers} />
        </p>
        <p className="text-sm text-muted-foreground">{task.project_name}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center -space-x-2">
          {task.assignedTo?.slice(0, 3).map((user: User) => (
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
                <TooltipContent>
                  <p>{[user.first_name, user.last_name].filter(Boolean).join(' ')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        {task.due_date && (
          <div className={cn(
            "text-sm font-medium whitespace-nowrap",
            isPast(new Date(task.due_date)) && !task.completed ? "text-destructive" : "text-muted-foreground"
          )}>
            {format(new Date(task.due_date), 'MMM d')}
          </div>
        )}
      </div>
    </button>
  );
};


const ProjectTasksView = () => {
  const { data: tasks = [], isLoading, refetch } = useTasks({ sortConfig: { key: 'created_at', direction: 'desc' } });
  const { data: allUsers = [] } = useProfiles();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const { upsertTask, isUpserting, deleteTask } = useTaskMutations(refetch);

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
            <TaskListItem key={task.id} task={task} onClick={handleTaskClick} allUsers={allUsers} />
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