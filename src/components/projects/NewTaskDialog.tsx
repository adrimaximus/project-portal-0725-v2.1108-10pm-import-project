import TaskFormDialog from '@/components/projects/TaskFormDialog';
import { UpsertTaskPayload } from '@/types';
import { User } from '@/types';

interface NewTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpsertTaskPayload) => void;
  isLoading: boolean;
  allPeople: User[];
}

const NewTaskDialog = ({ isOpen, onClose, onSave, isLoading }: NewTaskDialogProps) => {
  return (
    <TaskFormDialog
      open={isOpen}
      onOpenChange={onClose}
      onSubmit={onSave}
      isSubmitting={isLoading}
    />
  );
};

export default NewTaskDialog;