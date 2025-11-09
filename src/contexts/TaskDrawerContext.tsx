import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Task, Project } from '@/types';

interface TaskDrawerContextType {
  isOpen: boolean;
  task: Task | null;
  project: Project | null;
  onOpen: (task: Task, project: Project) => void;
  onClose: () => void;
}

const TaskDrawerContext = createContext<TaskDrawerContextType | undefined>(undefined);

export const useTaskDrawer = () => {
  const context = useContext(TaskDrawerContext);
  if (!context) {
    throw new Error('useTaskDrawer must be used within a TaskDrawerProvider');
  }
  return context;
};

export const TaskDrawerProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  const onOpen = useCallback((taskToView: Task, projectContext: Project) => {
    setTask(taskToView);
    setProject(projectContext);
    setIsOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
    // Delay resetting state to allow for closing animation
    setTimeout(() => {
      setTask(null);
      setProject(null);
    }, 300);
  }, []);

  const value = { isOpen, task, project, onOpen, onClose };

  return (
    <TaskDrawerContext.Provider value={value}>
      {children}
    </TaskDrawerContext.Provider>
  );
};