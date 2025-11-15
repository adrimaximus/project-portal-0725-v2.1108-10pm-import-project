import { useTaskDrawer } from '@/contexts/TaskDrawerContext';
import TaskDetailCard from '@/components/projects/TaskDetailCard';
import { useTaskModal } from '@/contexts/TaskModalContext';
import { Drawer } from '@/components/ui/drawer';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useState, useMemo, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Task, Project } from '@/types';
import { useTasks } from '@/hooks/useTasks';
import { useUnreadTasks } from '@/hooks/useUnreadTasks';

const GlobalTaskDrawer = () => {
  const { isOpen, onClose, task: initialTask, project, highlightedCommentId } = useTaskDrawer();
  const { onOpen: onOpenTaskModal } = useTaskModal();
  const { deleteTask, markTaskAsRead } = useTaskMutations();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const { unreadTaskIds } = useUnreadTasks();

  // This will use the cached data from MyTasksWidget if the query key matches
  const { data: allTasks } = useTasks({ sortConfig: { key: 'due_date', direction: 'asc' } });

  const task = useMemo(() => {
    if (!initialTask) return null;
    // Find the latest version of the task from the main query
    const updatedTask = allTasks?.find(t => t.id === initialTask.id);
    return updatedTask || initialTask;
  }, [initialTask, allTasks]);

  useEffect(() => {
    if (isOpen && task && unreadTaskIds.includes(task.id)) {
      markTaskAsRead(task.id);
    }
  }, [isOpen, task, unreadTaskIds, markTaskAsRead]);

  const handleEdit = (taskToEdit: Task) => {
    onClose(); // Close the drawer
    onOpenTaskModal(taskToEdit, undefined, project || undefined); // Open the edit modal
  };

  const handleDelete = (taskToDelete: Task) => {
    setTaskToDelete(taskToDelete);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id, {
        onSuccess: () => {
          toast.success("Task deleted.");
          setTaskToDelete(null);
          onClose();
        }
      });
    }
  };

  if (!isOpen || !task) {
    return null;
  }

  return (
    <>
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <TaskDetailCard
          task={task}
          onClose={onClose}
          onEdit={handleEdit}
          onDelete={handleDelete}
          highlightedCommentId={highlightedCommentId}
        />
      </Drawer>
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Are you sure you want to delete this task?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GlobalTaskDrawer;