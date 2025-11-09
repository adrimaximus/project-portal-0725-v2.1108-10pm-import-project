import { useTaskDrawer } from '@/contexts/TaskDrawerContext';
import TaskDetailCard from '@/components/projects/TaskDetailCard';
import { useTaskModal } from '@/contexts/TaskModalContext';
import { Drawer } from '@/components/ui/drawer';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Task } from '@/types';

const GlobalTaskDrawer = () => {
  const { isOpen, onClose, task, project } = useTaskDrawer();
  const { onOpen: onOpenTaskModal } = useTaskModal();
  const { deleteTask } = useTaskMutations();
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

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