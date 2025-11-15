import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Task, Project } from '@/types';

interface TaskDrawerContextType {
  isOpen: boolean;
  task: Task | null;
  project: Project | null;
  highlightedCommentId: string | null;
  onOpen: (task: Task, project: Project, highlightedCommentId?: string | null) => void;
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
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  const onOpen = useCallback((taskToView: Task, projectContext: Project, commentId?: string | null) => {
    setTask(taskToView);
    setProject(projectContext);
    setHighlightedCommentId(commentId || null);
    setIsOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
    // Delay resetting state to allow for closing animation
    setTimeout(() => {
      setTask(null);
      setProject(null);
      setHighlightedCommentId(null);
    }, 300);
  }, []);

  const value = { isOpen, task, project, highlightedCommentId, onOpen, onClose };

  return (
    <TaskDrawerContext.Provider value={value}>
      {children}
    </TaskDrawerContext.Provider>
  );
};