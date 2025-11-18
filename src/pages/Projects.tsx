import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { createProject, updateProjectDetails, deleteProject } from '@/api/projects';
import { getProjectTasks, upsertTask, deleteTask, toggleTaskCompletion } from '@/api/tasks';
import { getPeople } from '@/api/people';
import { Project, Task as ProjectTask, Person, UpsertTaskPayload, TaskStatus, ProjectStatus } from '@/types';
import { toast } from 'sonner';

import ProjectsToolbar from '@/components/projects/ProjectsToolbar';
import ProjectViewContainer from '@/components/projects/ProjectViewContainer';
import { GoogleCalendarImportDialog } from '@/components/projects/GoogleCalendarImportDialog';
import { AdvancedFiltersState } from '@/types';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useCreateProject } from '@/hooks/useCreateProject';
import { useTaskMutations, UpdateTaskOrderPayload } from '@/hooks/useTaskMutations';
import { useProjectMutations } from '@/hooks/useProjectMutations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PortalLayout from '@/components/PortalLayout';
import { getErrorMessage, formatInJakarta } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useTaskModal } from '@/contexts/TaskModalContext';
import { getProjectBySlug } from '@/lib/projectsApi';
import { useUnreadTasks } from '@/hooks/useUnreadTasks';
import { useSortConfig } from '@/hooks/useSortConfig';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ProjectTasksView from '@/components/projects/ProjectTasksView';

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

const ProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const { user } = useAuth();
  const { taskId: taskIdFromParams } = useParams<{ taskId: string }>();
  const { onOpen: onOpenTaskModal } = useTaskModal();
  
  const [taskToHighlight, setTaskToHighlight] = useState<string | null>(null);
  const highlightedTaskId = taskIdFromParams || searchParams.get('highlight') || taskToHighlight;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { unreadTaskIds } = useUnreadTasks();

  const onHighlightComplete = useCallback(() => {
    if (taskIdFromParams) {
      navigate(`/projects?view=tasks`, { replace: true });
    } else {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('highlight');
      setSearchParams(newSearchParams, { replace: true });
    }
    setTaskToHighlight(null);
  }, [searchParams, setSearchParams, taskIdFromParams, navigate]);

  const { 
    data, 
    isLoading: isLoadingProjects, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch: refetchProjects 
  } = useProjects({ fetchAll: true });

  const projectsData = useMemo(() => data?.pages.flatMap(page => page.projects) ?? [], [data]);
  
  const {
    view, handleViewChange,
    kanbanGroupBy, setKanbanGroupBy,
    hideCompletedTasks, toggleHideCompleted,
    searchTerm, handleSearchChange,
    advancedFilters, handleAdvancedFiltersChange,
    dateRange, setDateRange,
    sortConfig: projectSortConfig, requestSort: requestProjectSort,
    sortedProjects,
    clearFilters,
  } = useProjectFilters(projectsData);

  const hasActiveFilters = useMemo(() => {
    return !!searchTerm || !!dateRange?.from || (advancedFilters.ownerIds?.length || 0) > 0 || (advancedFilters.memberIds?.length || 0) > 0 || (advancedFilters.excludedStatus?.length || 0) > 0;
  }, [searchTerm, dateRange, advancedFilters]);

  const { data: allMembers = [] } = useQuery({
    queryKey: ['project_members_distinct'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_project_members_distinct');
      if (error) {
        toast.error('Failed to load project members for filtering.');
        console.error(error);
        return [];
      }
      return data as { id: string; name: string }[];
    }
  });

  const { data: allOwners = [] } = useQuery({
    queryKey: ['project_owners'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_project_owners');
      if (error) {
        toast.error('Failed to load project owners for filtering.');
        console.error(error);
        return [];
      }
      return data as { id: string; name: string }[];
    }
  });

  const isTaskView = view === 'tasks' || view === 'tasks-kanban';

  const projectIdsForTaskView = useMemo(() => {
    if (!isTaskView) return undefined;
    if (isLoadingProjects) return undefined;
  
    const visibleProjects = projectsData.filter(project => 
      !(advancedFilters.excludedStatus || []).includes(project.status)
    );
    
    return visibleProjects.map(project => project.id);
  
  }, [isTaskView, projectsData, advancedFilters.excludedStatus, isLoadingProjects]);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const { data: isGCalConnected } = useQuery({
    queryKey: ['googleCalendarConnection', user?.id],
    queryFn: async () => {
        if (!user) return false;
        const { data } = await supabase.from('google_calendar_tokens').select('user_id').eq('user_id', user.id).maybeSingle();
        return !!data;
    },
    enabled: !!user,
  });

  const importEventsMutation = useMutation({
    mutationFn: async (events: any[]) => {
        const { error } = await supabase.functions.invoke('import-google-calendar-events', { body: { eventsToImport: events } });
        if (error) throw error;
    },
    onSuccess: () => {
        toast.success("Events imported successfully as projects!");
        setIsImportDialogOpen(false);
        refetchProjects();
    },
    onError: (error) => {
        toast.error("Failed to import events.", { description: error.message });
    }
  });

  const refetch = useCallback(() => {
    if (isTaskView) {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } else {
      refetchProjects();
    }
  }, [isTaskView, refetchProjects, queryClient]);

  const { updateProjectStatus } = useProjectMutations();

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (deletedProjectId) => {
      const deletedProject = projectsData.find(p => p.id === deletedProjectId);
      toast.success(`Project "${deletedProject?.name || 'Project'}" has been deleted.`);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any, deletedProjectId) => {
      const deletedProject = projectsData.find(p => p.id === deletedProjectId);
      toast.error(`Failed to delete project "${deletedProject?.name || 'Project'}".`, { description: getErrorMessage(error) });
    }
  });

  const handleDeleteProject = (projectId: string) => {
    const project = projectsData.find(p => p.id === projectId);
    if (project) setProjectToDelete(project);
  };

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  const handleRefresh = () => {
    toast.info("Refreshing data...");
    refetch();
  };

  const handleStatusChange = (projectId: string, newStatus: ProjectStatus) => {
    const project = projectsData.find(p => p.id === projectId);
    if (!project) return;
    const hasOpenTasks = project.tasks?.some(task => !task.completed) ?? false;
    if (newStatus === 'Completed' && hasOpenTasks) {
        toast.error("Cannot mark project as 'Completed' while there are still open tasks.");
        return;
    }
    updateProjectStatus.mutate({ projectId, status: newStatus });
  };

  const sortParam = searchParams.get('sort');
  const isUnreadSortActive = isTaskView && sortParam === 'unread';

  const handleClearUnreadSort = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('sort');
    setSearchParams(newSearchParams, { replace: true });
  };

  return (
    <PortalLayout disableMainScroll noPadding>
      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the project "{projectToDelete?.name}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteProject}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <GoogleCalendarImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={(events) => importEventsMutation.mutate(events)}
        isImporting={importEventsMutation.isPending}
      />

      <div className="flex-1 flex flex-col min-h-0 rounded-none border-0 sm:border sm:rounded-lg">
        <div className="flex-shrink-0 bg-background z-10 border-b">
          <ProjectsToolbar
            view={view} onViewChange={handleViewChange}
            kanbanGroupBy={kanbanGroupBy} onKanbanGroupByChange={setKanbanGroupBy}
            hideCompletedTasks={hideCompletedTasks}
            onToggleHideCompleted={toggleHideCompleted}
            onNewTaskClick={() => onOpenTaskModal()}
            isTaskView={isTaskView}
            isGCalConnected={isGCalConnected}
            onImportClick={() => setIsImportDialogOpen(true)}
            onRefreshClick={handleRefresh}
            advancedFilters={advancedFilters}
            onAdvancedFiltersChange={handleAdvancedFiltersChange}
            allPeople={allMembers}
            allOwners={allOwners}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
        <div ref={scrollContainerRef} className="flex-grow min-h-0 overflow-y-auto relative">
          {(isLoadingProjects) && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <div className="p-0 data-[view=kanban]:px-4 data-[view=kanban]:pb-4 data-[view=kanban]:md:px-6 data-[view=kanban]:md:pb-6 data-[view=tasks-kanban]:p-0" data-view={view}>
            {isTaskView ? (
              <ProjectTasksView
                view={view}
                projectIds={projectIdsForTaskView}
                hideCompletedTasks={hideCompletedTasks}
                searchTerm={searchTerm}
                highlightedTaskId={highlightedTaskId}
                onHighlightComplete={onHighlightComplete}
              />
            ) : (
              <ProjectViewContainer
                view={view}
                projects={sortedProjects}
                isLoading={isLoadingProjects && !projectsData.length}
                onDeleteProject={handleDeleteProject}
                sortConfig={projectSortConfig}
                requestSort={(key) => requestProjectSort(key as keyof Project)}
                rowRefs={rowRefs}
                kanbanGroupBy={kanbanGroupBy}
                onStatusChange={handleStatusChange}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                searchTerm={searchTerm}
              />
            )}
          </div>
          {hasNextPage && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Load More Projects
              </Button>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectsPage;