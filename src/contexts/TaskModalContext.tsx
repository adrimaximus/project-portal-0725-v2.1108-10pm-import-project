import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Task, UpsertTaskPayload, Project } from '@/types';

interface TaskModalContextType {
  isOpen: boolean;
  task: Task | null;
  project: Project | null;
  initialData?: Partial<UpsertTaskPayload>;
  onOpen: (task?: Task | null, initialData?: Partial<UpsertTaskPayload>, project?: Project | null) => void;
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
  const [project, setProject] = useState<Project | null>(null);
  const [initialData, setInitialData] = useState<Partial<UpsertTaskPayload> | undefined>();

  const onOpen = useCallback((taskToEdit?: Task | null, data?: Partial<UpsertTaskPayload>, projectToContext?: Project | null) => {
    setTask(taskToEdit || null);
    setProject(projectToContext || null);
    setInitialData(data);
    setIsOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
    // Delay resetting state to avoid flicker during closing animation
    setTimeout(() => {
      setTask(null);
      setProject(null);
      setInitialData(undefined);
    }, 300);
  }, []);

  const value = { isOpen, task, project, initialData, onOpen, onClose };

  return (
    <TaskModalContext.Provider value={value}>
      {children}
    </TaskModalContext.Provider>
  );
};