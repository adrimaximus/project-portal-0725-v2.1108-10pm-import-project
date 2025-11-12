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
import { Loader2 } from 'lucide-react';
import { useTaskModal } from '@/contexts/TaskModalContext';
import { getProjectBySlug } from '@/lib/projectsApi';
import { useUnreadTasks } from '@/hooks/useUnreadTasks';
import { useSortConfig } from '@/hooks/useSortConfig';

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
    sortedProjects
  } = useProjectFilters(projectsData);

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

  const { sortConfig: taskSortConfig, requestSort: requestTaskSort } = useSortConfig({ key: 'updated_at', direction: 'desc' as 'desc' | 'asc' });

  const isTaskView = view === 'tasks' || view === 'tasks-kanban';

  const projectIdsForTaskView = useMemo(() => {
    if (!isTaskView) return undefined;
    // When projects are loading, we don't have the IDs yet. Return undefined to keep useTasks disabled.
    if (isLoadingProjects) return undefined;
  
    const visibleProjects = projectsData.filter(project => 
      !(advancedFilters.excludedStatus || []).includes(project.status)
    );
    
    return visibleProjects.map(project => project.id);
  
  }, [isTaskView, projectsData, advancedFilters.excludedStatus, isLoadingProjects]);

  const finalTaskSortConfig = view === 'tasks-kanban' ? { key: 'kanban_order', direction: 'asc' as const } : taskSortConfig;

  const { data: tasksData = [], isLoading: isLoadingTasks, refetch: refetchTasks } = useTasks({
    projectIds: projectIdsForTaskView,
    hideCompleted: hideCompletedTasks,
    sortConfig: finalTaskSortConfig,
    enabled: isTaskView && projectIdsForTaskView !== undefined,
  });

  useEffect(() => {
    if (highlightedTaskId && tasksData.length > 0) {
      const task = tasksData.find(t => t.id === highlightedTaskId);
      if (task) {
        const originalTitle = document.title;
        document.title = `Task: ${task.title} | ${task.project_name || 'Project'}`;
        return () => { document.title = originalTitle; };
      }
    }
  }, [highlightedTaskId, tasksData]);

  useEffect(() => {
    if (isLoadingProjects || isLoadingTasks || searchParams.get('highlight') || taskIdFromParams) {
      return;
    }

    if (tasksData.length > 0 && unreadTaskIds.length > 0) {
      const unreadTasks = tasksData.filter(task => unreadTaskIds.includes(task.id));
      
      if (unreadTasks.length > 0) {
        unreadTasks.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        const newestUnreadTask = unreadTasks[0];
        setTaskToHighlight(newestUnreadTask.id);
      }
    }
  }, [tasksData, unreadTaskIds, isLoadingProjects, isLoadingTasks, searchParams, taskIdFromParams]);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
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
    if (isTaskView) refetchTasks();
    else refetchProjects();
  }, [isTaskView, refetchTasks, refetchProjects]);

  const { deleteTask, toggleTaskCompletion, isToggling, upsertTask, updateTaskStatusAndOrder } = useTaskMutations(refetch);
  const { updateProjectStatus } = useProjectMutations();

  const filteredTasks = useMemo(() => {
    let tasksToFilter = tasksData || [];
    const selectedPeopleIds = [...(advancedFilters.ownerIds || []), ...(advancedFilters.memberIds || [])];
    if (selectedPeopleIds.length > 0) {
        const uniqueSelectedPeopleIds = [...new Set(selectedPeopleIds)];
        tasksToFilter = tasksToFilter.filter(task => 
            task.assignedTo?.some(assignee => uniqueSelectedPeopleIds.includes(assignee.id))
        );
    }
    if (!searchTerm) return tasksToFilter;
    const lowercasedFilter = searchTerm.toLowerCase();
    return tasksToFilter.filter(task => 
      task.title.toLowerCase().includes(lowercasedFilter) ||
      (task.description && task.description.toLowerCase().includes(lowercasedFilter)) ||
      (task.project_name && task.project_name.toLowerCase().includes(lowercasedFilter))
    );
  }, [tasksData, searchTerm, advancedFilters.ownerIds, advancedFilters.memberIds]);

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

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete, {
        onSuccess: () => {
          setTaskToDelete(null);
        }
      });
    }
  };

  const handleToggleTaskCompletion = (task: ProjectTask, completed: boolean) => {
    toggleTaskCompletion({ task, completed });
  };

  const handleTaskStatusChange = (task: ProjectTask, newStatus: TaskStatus) => {
    upsertTask({
        id: task.id,
        project_id: task.project_id,
        title: task.title,
        status: newStatus,
        completed: newStatus === 'Done',
    }, {
        onSuccess: () => {
            toast.success(`Task "${task.title}" status updated to "${newStatus}"`);
        }
    });
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

  const handleTaskOrderChange = (payload: UpdateTaskOrderPayload) => {
    updateTaskStatusAndOrder(payload);
  };

  const handleEditTask = async (task: ProjectTask) => {
    try {
      const projectForTask = await getProjectBySlug(task.project_slug);
      if (!projectForTask) {
        throw new Error("Project for this task could not be found.");
      }
      onOpenTaskModal(task, undefined, projectForTask);
    } catch (error) {
      toast.error("Could not open task editor.", { description: getErrorMessage(error) });
    }
  };

  const tasksQueryKey = ['tasks', { 
    projectIds: projectIdsForTaskView, 
    hideCompleted: hideCompletedTasks, 
    sortConfig: finalTaskSortConfig 
  }];

  return (
    <PortalLayout disableMainScroll noPadding>
      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the project "{projectToDelete?.name}".</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteProject}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Task?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. Are you sure you want to delete this task?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteTask}>Delete</AlertDialogAction></AlertDialogFooter>
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
        <div ref={scrollContainerRef} className="flex-grow min-h-0 overflow-y-auto">
          <div className="p-0 data-[view=kanban]:px-4 data-[view=kanban]:pb-4 data-[view=kanban]:md:px-6 data-[view=kanban]:md:pb-6 data-[view=tasks-kanban]:p-0" data-view={view}>
            <ProjectViewContainer
              view={view}
              projects={sortedProjects}
              tasks={filteredTasks}
              isLoading={isLoadingProjects && !projectsData.length}
              isTasksLoading={isLoadingTasks}
              onDeleteProject={handleDeleteProject}
              sortConfig={projectSortConfig}
              requestSort={(key) => requestProjectSort(key as keyof Project)}
              rowRefs={rowRefs}
              kanbanGroupBy={kanbanGroupBy}
              onEditTask={handleEditTask}
              onDeleteTask={setTaskToDelete}
              onToggleTaskCompletion={handleToggleTaskCompletion}
              onTaskStatusChange={handleTaskStatusChange}
              isToggling={isToggling}
              taskSortConfig={taskSortConfig}
              requestTaskSort={requestTaskSort}
              refetch={refetch}
              tasksQueryKey={tasksQueryKey}
              highlightedTaskId={highlightedTaskId}
              onHighlightComplete={onHighlightComplete}
              onStatusChange={handleStatusChange}
              onTaskOrderChange={handleTaskOrderChange}
              unreadTaskIds={unreadTaskIds}
            />
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