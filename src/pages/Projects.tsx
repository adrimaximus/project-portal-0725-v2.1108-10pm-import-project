import { useState, useMemo, useEffect } from "react";
import PortalLayout from "@/components/PortalLayout";
import { useProjects } from "@/hooks/useProjects";
import { useProfiles } from "@/hooks/useProfiles";
import { Loader2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProjectAdvancedFilters, { AdvancedFiltersState } from "@/components/projects/ProjectAdvancedFilters";
import ListView from "@/components/projects/ListView";
import { Button } from "@/components/ui/button";

const Projects = () => {
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: profiles = [], isLoading: isLoadingProfiles } = useProfiles();
  const navigate = useNavigate();

  const [unreadProjectIds, setUnreadProjectIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    // Mock logic to determine unread projects. In a real app, this would
    // be based on user's last_viewed_at vs project's updated_at.
    // For now, we'll consider projects updated in the last 2 days as "unread".
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const newUnread = new Set<string>();
    projects.forEach(p => {
      if (p.updated_at && new Date(p.updated_at) > twoDaysAgo) {
        newUnread.add(p.id);
      }
    });
    setUnreadProjectIds(newUnread);
  }, [projects]);

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

      if (showUnreadOnly && !unreadProjectIds.has(project.id)) {
        return false;
      }
      
      const statusMatch = status.length === 0 || status.includes(project.status);
      
      const assigneeMatch = selectedPeopleIds.length === 0 || 
        (project.assignedTo && project.assignedTo.some(assignee => selectedPeopleIds.includes(assignee.id)));
      
      return statusMatch && assigneeMatch;
    });
  }, [projects, advancedFilters, unreadProjectIds]);

  const handleProjectClick = (projectId: string, projectSlug: string) => {
    setUnreadProjectIds(prev => {
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