import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Project, dummyProjects as initialProjects, User } from '@/data/projects';
import { useUser } from './UserContext';

// This represents a partial project object created from a calendar event
type NewCalendarProject = Omit<Project, 'description' | 'paymentStatus' | 'createdBy' | 'tasks' | 'comments' | 'activities' | 'briefFiles' | 'services'>;

interface ProjectContextType {
  projects: Project[];
  getProjectById: (id: string) => Project | undefined;
  addProjectsFromCalendar: (newProjects: NewCalendarProject[]) => void;
  updateProject: (id:string, updates: Partial<Project>) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const { user } = useUser();

  const getProjectById = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);
  
  const addProjectsFromCalendar = (newProjects: NewCalendarProject[]) => {
    const fullNewProjects: Project[] = newProjects.map(p => ({
      ...p,
      description: 'Imported from Google Calendar.',
      paymentStatus: 'Proposed',
      createdBy: user,
      tasks: [],
      comments: [],
      activities: [],
      briefFiles: [],
      services: ['From Calendar'],
    }));

    setProjects(prevProjects => [...fullNewProjects, ...prevProjects].sort((a, b) => {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return dateB - dateA;
    }));
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prevProjects =>
      prevProjects.map(p => (p.id === id ? { ...p, ...updates, lastUpdated: new Date().toISOString() } : p))
    );
  };

  return (
    <ProjectContext.Provider value={{ projects, getProjectById, addProjectsFromCalendar, updateProject }}>
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