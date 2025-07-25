import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Project } from '@/types';
import { dummyProjects } from '@/data/projects';
import { useToast } from '@/components/ui/use-toast';

interface ProjectContextType {
  projects: Project[];
  addProject: (projectData: { name: string; description: string }) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(dummyProjects);
  const { toast } = useToast();

  const addProject = (projectData: { name: string; description: string }) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectData.name,
      description: projectData.description,
      status: 'In Progress',
      progress: 0,
      lastUpdated: 'Baru saja',
      team: [],
      assignedTo: undefined,
      budget: 0,
      deadline: '',
      paymentStatus: 'Pending',
      paymentDueDate: '',
      invoiceAttachmentUrl: null,
      tickets: { open: 0, total: 0 },
    };
    setProjects(prevProjects => [newProject, ...prevProjects]);
    toast({
      title: "Proyek Berhasil Dibuat",
      description: `Proyek "${projectData.name}" telah ditambahkan ke dasbor Anda.`,
    });
  };

  return (
    <ProjectContext.Provider value={{ projects, addProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects harus digunakan di dalam ProjectProvider');
  }
  return context;
};