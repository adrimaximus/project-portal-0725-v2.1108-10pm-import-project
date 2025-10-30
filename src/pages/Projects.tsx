import { useState, useMemo, useEffect } from "react";
import PortalLayout from "@/components/PortalLayout";
import { useProjects } from "@/hooks/useProjects";
import { useProfiles } from "@/hooks/useProfiles";
import { Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProjectAdvancedFilters, { AdvancedFiltersState } from "@/components/projects/ProjectAdvancedFilters";
import ListView from "@/components/projects/ListView";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Projects = () => {
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: profiles = [], isLoading: isLoadingProfiles } = useProfiles();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [displayedUnreadIds, setDisplayedUnreadIds] = useState<Set<string>>(new Set());

  const { data: unreadProjectIdsSet } = useQuery({
    queryKey: ['unreadProjectIds', user?.id],
    queryFn: async () => {
        if (!user) return new Set<string>();
        const { data, error } = await supabase
            .from('notification_recipients')
            .select('notifications!inner(resource_id, resource_type)')
            .eq('user_id', user.id)
            .is('read_at', null);

        if (error) {
            console.error("Error fetching unread project IDs:", error);
            return new Set<string>();
        }

        const projectIds = new Set<string>();
        data.forEach(item => {
            const notification = item.notifications as unknown as { resource_id: string, resource_type: string } | null;
            if (notification && notification.resource_id && (notification.resource_type === 'project' || notification.resource_type === 'task' || notification.resource_type === 'comment')) {
                projectIds.add(notification.resource_id);
            }
        });
        return projectIds;
    },
    enabled: !!user,
    staleTime: 60000, // 1 minute
  });

  const unreadProjectIds = unreadProjectIdsSet || new Set<string>();

  const markProjectNotificationsAsRead = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.rpc('mark_project_notifications_as_read', { p_project_id: projectId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['hasUnreadProjectActivity', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unreadProjectIds', user?.id] });
    },
    onError: (error) => {
      console.error("Error marking project notifications as read:", error);
    }
  });

  const markMultipleProjectNotificationsAsRead = useMutation({
    mutationFn: async (projectIds: string[]) => {
        if (projectIds.length === 0) return;
        const { error } = await supabase.rpc('mark_multiple_project_notifications_as_read', { p_project_ids: projectIds });
        if (error) throw error;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['hasUnreadProjectActivity', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['unreadProjectIds', user?.id] });
    },
    onError: (error) => {
        console.error("Error marking multiple project notifications as read:", error);
    }
  });

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>(() => {
    try {
      const savedFilters = localStorage.getItem('projectAdvancedFilters');
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters);
        if (parsed.dueDate && parsed.dueDate.from) parsed.dueDate.from = new Date(parsed.dueDate.from);
        if (parsed.dueDate && parsed.dueDate.to) parsed.dueDate.to = new Date(parsed.dueDate.to);
        return {
          selectedPeopleIds: [],
          status: [],
          dueDate: null,
          showUnreadOnly: false,
          ...parsed,
        };
      }
    } catch (error) {
      console.error("Failed to parse filters from localStorage", error);
    }
    return { selectedPeopleIds: [], status: [], dueDate: null, showUnreadOnly: false };
  });

  useEffect(() => {
    try {
      localStorage.setItem('projectAdvancedFilters', JSON.stringify(advancedFilters));
    } catch (error) {
      console.error("Failed to save filters to localStorage", error);
    }
  }, [advancedFilters]);

  useEffect(() => {
    if (advancedFilters.showUnreadOnly) {
      setDisplayedUnreadIds(unreadProjectIds);
      if (unreadProjectIds.size > 0) {
        markMultipleProjectNotificationsAsRead.mutate(Array.from(unreadProjectIds));
      }
    } else {
      setDisplayedUnreadIds(new Set());
    }
  }, [advancedFilters.showUnreadOnly, unreadProjectIds, markMultipleProjectNotificationsAsRead]);

  const allPeople = useMemo(() => {
    if (!profiles) return [];
    return profiles.map(p => ({ 
      id: p.id, 
      name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || 'Unnamed User'
    }));
  }, [profiles]);

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const { selectedPeopleIds, status, showUnreadOnly } = advancedFilters;

      if (showUnreadOnly && !displayedUnreadIds.has(project.id)) {
        return false;
      }
      
      const statusMatch = status.length === 0 || status.includes(project.status);
      
      const assigneeMatch = selectedPeopleIds.length === 0 || 
        (project.assignedTo && project.assignedTo.some(assignee => selectedPeopleIds.includes(assignee.id)));
      
      return statusMatch && assigneeMatch;
    });
  }, [projects, advancedFilters, displayedUnreadIds]);

  const handleProjectClick = (projectId: string, projectSlug: string) => {
    if (unreadProjectIds.has(projectId)) {
      markProjectNotificationsAsRead.mutate(projectId);
    }
    setDisplayedUnreadIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(projectId);
      return newSet;
    });
    navigate(`/projects/${projectSlug}`);
  };

  const handleDeleteProject = (projectId: string) => {
    alert(`Delete project ${projectId} - functionality to be implemented.`);
  };

  if (isLoadingProjects || isLoadingProfiles) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">Manage all your projects in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <ProjectAdvancedFilters
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              allPeople={allPeople}
            />
            <Button><Plus className="mr-2 h-4 w-4" /> New Project</Button>
          </div>
        </div>
        <ListView 
          projects={filteredProjects}
          onDeleteProject={handleDeleteProject}
          unreadProjectIds={unreadProjectIds}
          onProjectClick={handleProjectClick}
        />
      </div>
    </PortalLayout>
  );
};

export default Projects;