import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectStatus, PaymentStatus } from '@/data/projects';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  refetchProjects: () => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async (isInitialLoad = false) => {
    if (!user) {
      setProjects([]);
      if (isInitialLoad) setLoading(false);
      return;
    }

    if (isInitialLoad) setLoading(true);

    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*');
      if (projectsError) throw projectsError;

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        localStorage.setItem('projectsCache', JSON.stringify([]));
        if (isInitialLoad) setLoading(false);
        return;
      }

      const projectIds = projectsData.map(p => p.id);

      const [membersRes, tasksRes, commentsRes] = await Promise.all([
        supabase.from('project_members').select('*, profile:profiles(*)').in('project_id', projectIds),
        supabase.from('tasks').select('*, assignedTo:task_assignees(profile:profiles(*))').in('project_id', projectIds),
        supabase.from('comments').select('project_id, is_ticket, id').in('project_id', projectIds),
      ]);

      if (membersRes.error || tasksRes.error || commentsRes.error) {
        console.error("Error fetching project details:", membersRes.error, tasksRes.error, commentsRes.error);
        throw new Error("Failed to fetch project details.");
      }

      const creatorIds = [...new Set(projectsData.map(p => p.created_by).filter(Boolean))];
      const { data: creatorProfilesData, error: creatorError } = await supabase.from('profiles').select('*').in('id', creatorIds);
      if (creatorError) throw creatorError;
      const creatorsMap = new Map(creatorProfilesData.map(p => [p.id, p]));

      const mappedProjects: Project[] = projectsData.map(p => {
        const members = membersRes.data?.filter(m => m.project_id === p.id) || [];
        const tasks = tasksRes.data?.filter(t => t.project_id === p.id) || [];
        const comments = commentsRes.data?.filter(c => c.project_id === p.id) || [];
        const creatorProfile = creatorsMap.get(p.created_by);

        return {
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          status: p.status as ProjectStatus,
          progress: p.progress,
          budget: p.budget,
          startDate: p.start_date,
          dueDate: p.due_date,
          paymentStatus: p.payment_status as PaymentStatus,
          createdBy: creatorProfile ? {
              id: creatorProfile.id,
              name: `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || creatorProfile.email,
              email: creatorProfile.email,
              avatar: creatorProfile.avatar_url,
              initials: `${creatorProfile.first_name?.[0] || ''}${creatorProfile.last_name?.[0] || ''}`.toUpperCase(),
          } : null,
          assignedTo: members.map((m: any) => {
              const profile = m.profile;
              return {
                  id: profile.id,
                  name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
                  email: profile.email,
                  avatar: profile.avatar_url,
                  initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase(),
                  role: m.role,
              };
          }),
          tasks: tasks.map((t: any) => ({
              id: t.id,
              title: t.title,
              completed: t.completed,
              assignedTo: (t.assignedTo || []).map((a: any) => {
                  const profile = a.profile;
                  return {
                      id: profile.id,
                      name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
                      email: profile.email,
                      avatar: profile.avatar_url,
                      initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase(),
                  };
              }),
          })),
          comments: comments.map((c: any) => ({
              id: c.id,
              isTicket: c.is_ticket,
          })),
        } as Project;
      });

      setProjects(mappedProjects);
      localStorage.setItem('projectsCache', JSON.stringify(mappedProjects));
    } catch (e: any) {
      toast.error("Failed to fetch projects.", {
        id: 'fetch-projects-error',
        description: e.message || "There was a problem loading your project data. Please try refreshing the page.",
      });
      console.error(e);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    // Load from cache first
    try {
      const cachedProjects = localStorage.getItem('projectsCache');
      if (cachedProjects) {
        setProjects(JSON.parse(cachedProjects));
        setLoading(false);
      } else {
        // No cache, fetch immediately
        fetchProjects(true);
      }
    } catch (error) {
      console.error("Failed to load projects from cache:", error);
      // If cache is corrupted, fetch immediately
      fetchProjects(true);
    }

    // Set up background refresh after 1 minute
    const timer = setTimeout(() => {
      fetchProjects(false); // false means it's a background refresh
    }, 60000);

    return () => clearTimeout(timer);
  }, [user, fetchProjects]);

  return (
    <ProjectsContext.Provider value={{ projects, loading, refetchProjects: () => fetchProjects(true) }}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};