import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, User } from '@/types';
import { useProject } from '@/hooks/useProject';
import { useProjectMutations } from '@/hooks/useProjectMutations';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface ProjectContextType {
  project: Project;
  editedProject: Project;
  isEditing: boolean;
  isSaving: boolean;
  canEdit: boolean;
  isLoading: boolean;
  user: User | null;
  handleFieldChange: (field: keyof Project, value: any) => void;
  handleEditToggle: () => void;
  handleSaveChanges: () => void;
  handleCancelChanges: () => void;
  handleToggleComplete: () => void;
  handleDeleteProject: () => void;
  mutations: ReturnType<typeof useProjectMutations>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | null>(null);

  const { data: project, isLoading, error } = useProject(slug!);
  const mutations = useProjectMutations(slug!);

  useEffect(() => {
    if (project) {
      setEditedProject(project);
    }
  }, [project]);

  if (isLoading) {
    // The consuming component will show a skeleton
    return null; 
  }

  if (error || !project || !editedProject) {
    // This case is handled by the consuming component, which will navigate away.
    return null;
  }

  const canEdit = user && (user.id === project.created_by.id || user.role === 'admin' || user.role === 'master admin');

  const handleFieldChange = (field: keyof Project, value: any) => {
    setEditedProject(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveChanges = () => {
    if (!editedProject) return;
    mutations.updateProject.mutate(editedProject, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleCancelChanges = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    const newStatus = project.status === 'Completed' ? 'In Progress' : 'Completed';
    mutations.updateProject.mutate({ ...editedProject, status: newStatus });
  };

  const value = {
    project,
    editedProject,
    isEditing,
    isSaving: mutations.updateProject.isPending,
    canEdit,
    isLoading,
    user,
    handleFieldChange,
    handleEditToggle: () => setIsEditing(true),
    handleSaveChanges,
    handleCancelChanges,
    handleToggleComplete,
    handleDeleteProject: () => mutations.deleteProject.mutate(project.id),
    mutations,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};