import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Task, UpsertTaskPayload } from '@/types';

interface TaskModalContextType {
  isOpen: boolean;
  task: Task | null;
  initialData?: Partial<UpsertTaskPayload>;
  onOpen: (task?: Task | null, initialData?: Partial<UpsertTaskPayload>) => void;
  onClose: () => void;
}

const TaskModalContext = createContext<TaskModalContextType | undefined>(undefined);

export const useTaskModal = () => {
  const context = useContext(TaskModalContext);
  if (!context) {
    throw new Error('useTaskModal must be used within a TaskModalProvider');
  }
  return context;
};

export const TaskModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [initialData, setInitialData] = useState<Partial<UpsertTaskPayload> | undefined>();

  const onOpen = useCallback((taskToEdit?: Task | null, data?: Partial<UpsertTaskPayload>) => {
    setTask(taskToEdit || null);
    setInitialData(data);
    setIsOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
    // Delay resetting state to avoid flicker during closing animation
    setTimeout(() => {
      setTask(null);
      setInitialData(undefined);
    }, 300);
  }, []);

  const value = { isOpen, task, initialData, onOpen, onClose };

  return (
    <TaskModalContext.Provider value={value}>
      {children}
    </TaskModalContext.Provider>
  );
};