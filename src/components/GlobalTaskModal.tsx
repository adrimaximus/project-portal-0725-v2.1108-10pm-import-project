import { useTaskModal } from '@/contexts/TaskModalContext';
import TaskFormDialog from '@/components/projects/TaskFormDialog';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { UpsertTaskPayload } from '@/types';

const GlobalTaskModal = () => {
  const { isOpen, onClose, task, initialData } = useTaskModal();
  const { upsertTask, isUpserting } = useTaskMutations();

  const handleSave = (data: UpsertTaskPayload) => {
    upsertTask(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  // We only render the dialog when it's open to ensure the form state is fresh.
  if (!isOpen) {
    return null;
  }

  return (
    <TaskFormDialog
      open={isOpen}
      onOpenChange={onClose}
      onSubmit={handleSave}
      isSubmitting={isUpserting}
      task={task}
      initialData={initialData}
    />
  );
};

export default GlobalTaskModal;