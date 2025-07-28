"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Project, dummyProjects } from '@/data/projects';

interface ProjectContextType {
  projects: Project[];
  updateProject: (updatedProject: Project) => void;
  getProjectById: (projectId: string) => Project | undefined;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(dummyProjects);

  const updateProject = (updatedProject: Project) => {
    setProjects(prevProjects =>
      prevProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const getProjectById = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };

  return (
    <ProjectContext.Provider value={{ projects, updateProject, getProjectById }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};