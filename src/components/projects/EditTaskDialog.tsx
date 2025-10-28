import TaskFormDialog from '@/components/projects/TaskFormDialog';
import { UpsertTaskPayload } from '@/types';
import { User, Task } from '@/types';

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpsertTaskPayload) => void;
  isLoading: boolean;
  task: Task;
  allPeople: User[];
}

const EditTaskDialog = ({ isOpen, onClose, onSave, isLoading, task }: EditTaskDialogProps) => {
  return (
    <TaskFormDialog
      open={isOpen}
      onOpenChange={onClose}
      onSubmit={onSave}
      isSubmitting={isLoading}
      task={task}
    />
  );
};

export default EditTaskDialog;