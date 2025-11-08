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
import { AdvancedFiltersState } from '@/components/projects/ProjectAdvancedFilters';
import { useProjectFilters } from '@/hooks/useProjectFilters';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useCreateProject } from '@/hooks/useCreateProject';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { useProjectMutations } from '@/hooks/useProjectMutations';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PortalLayout from '@/components/PortalLayout';
import { getErrorMessage, formatInJakarta } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTaskModal } from '@/contexts/TaskModalContext';

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';
type SortConfig<T> = { key: keyof T | null; direction: 'ascending' | 'descending' };

const ProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const { user } = useAuth();
  const { taskId: taskIdFromParams } = useParams<{ taskId: string }>();
  const { onOpen: onOpenTaskModal } = useTaskModal();

  const viewFromUrl = searchParams.get('view') as ViewMode;
  const view = taskIdFromParams ? 'tasks' : viewFromUrl || 'list';

  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'payment_status'>('status');
  const [hideCompletedTasks, setHideCompletedTasks] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const highlightedTaskId = taskIdFromParams || searchParams.get('highlight');

  const onHighlightComplete = useCallback(() => {
    if (taskIdFromParams) {
      navigate(`/projects?view=tasks`, { replace: true });
    } else {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('highlight');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, taskIdFromParams, navigate]);

  const { 
    data, 
    isLoading: isLoadingProjects, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch: refetchProjects 
  } = useProjects({ searchTerm });

  const projectsData = useMemo(() => data?.pages.flatMap(page => page.projects) ?? [], [data]);
  
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    ownerIds: [],
    memberIds: [],
    excludedStatus: [],
  });

  const { data: peopleData } = useQuery<Person[]>({
    queryKey: ['people'],
    queryFn: getPeople,
  });

  const allPeople = useMemo(() => {
    if (!peopleData) return [];
    return peopleData
      .filter(p => p.user_id)
      .map(p => ({ id: p.user_id!, name: p.full_name }));
  }, [peopleData]);

  const allOwners = useMemo(() => {
    if (!projectsData) return [];
    const ownerMap = new Map<string, { id: string, name: string }>();
    projectsData.forEach(project => {
      if (project.created_by && !ownerMap.has(project.created_by.id)) {
        ownerMap.set(project.created_by.id, {
          id: project.created_by.id,
          name: project.created_by.name,
        });
      }
    });
    return Array.from(ownerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projectsData]);

  const {
    dateRange, setDateRange,
    sortConfig: projectSortConfig, requestSort: requestProjectSort, sortedProjects
  } = useProjectFilters(projectsData, advancedFilters);

  const [taskSortConfig, setTaskSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'updated_at', direction: 'desc' });

  const requestTaskSort = useCallback((key: string) => {
    setTaskSortConfig(prevConfig => {
      let direction: 'asc' | 'desc' = 'asc';
      if (prevConfig.key === key && prevConfig.direction === 'asc') {
        direction = 'descending';
      }
      return { key, direction };
    });
  }, []);

  const finalTaskSortConfig = view === 'tasks-kanban' ? { key: 'kanban_order', direction: 'asc' as const } : taskSortConfig;

  const { data: tasksData = [], isLoading: isLoadingTasks, refetch: refetchTasks } = useTasks({
    hideCompleted: hideCompletedTasks,
    sortConfig: finalTaskSortConfig,
  });

  useEffect(() => {
    if (highlightedTaskId && tasksData.length > 0) {
      const task = tasksData.find(t => t.id === highlightedTaskId);
      if (task) {
        const originalTitle = document.title;
        document.title = `Task: ${task.title} | ${task.project_name || 'Project'}`;
        
        return () => {
          document.title = originalTitle;
        };
      }
    }
  }, [highlightedTaskId, tasksData]);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const createProjectMutation = useCreateProject();
  const [scrollToProjectId, setScrollToProjectId] = useState<string | null>(null);
  const initialTableScrollDone = useRef(false);
  
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
        const { error } = await supabase.functions.invoke('import-google-calendar-events', {
            body: { eventsToImport: events },
        });
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

  const isTaskView = view === 'tasks' || view === 'tasks-kanban';

  const refetch = useCallback(() => {
    if (isTaskView) {
      refetchTasks();
    } else {
      refetchProjects();
    }
  }, [isTaskView, refetchTasks, refetchProjects]);

  const { deleteTask, toggleTaskCompletion, isToggling } = useTaskMutations(refetch);
  const { updateProjectStatus } = useProjectMutations();

  const allTasks = useMemo(() => {
    if (isTaskView) {
      return tasksData || [];
    }
    if (!projectsData) return [];
    return projectsData.flatMap(p => p.tasks || []);
  }, [projectsData, tasksData, isTaskView]);

  const filteredTasks = useMemo(() => {
    let tasksToFilter = allTasks;
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
  }, [allTasks, searchTerm, advancedFilters.ownerIds, advancedFilters.memberIds]);

  useEffect(() => {
    if (view === 'table' && !initialTableScrollDone.current && sortedProjects.length > 0) {
      const todayStr = formatInJakarta(new Date(), 'yyyy-MM-dd');
      let targetProject = sortedProjects.find(p => p.start_date && formatInJakarta(p.start_date, 'yyyy-MM-dd') >= todayStr);
      if (!targetProject && sortedProjects.length > 0) {
        targetProject = sortedProjects[sortedProjects.length - 1];
      }
      if (targetProject) {
        setScrollToProjectId(targetProject.id);
        initialTableScrollDone.current = true;
      }
    }
  }, [sortedProjects, view]);

  useEffect(() => {
    if (scrollToProjectId) {
      const targetElement = rowRefs.current.get(scrollToProjectId);
      if (targetElement) {
        setTimeout(() => {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetElement.classList.add('bg-muted', 'transition-colors', 'duration-1000');
          setTimeout(() => {
            targetElement.classList.remove('bg-muted');
          }, 2000);
          setScrollToProjectId(null);
        }, 100);
      }
    }
  }, [scrollToProjectId]);

  const handleViewChange = (newView: ViewMode | null) => {
    if (newView) {
      if (taskIdFromParams) {
        navigate(`/projects?view=${newView}`);
      } else {
        setSearchParams({ view: newView }, { replace: true });
      }
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
        scrollContainerRef.current.scrollLeft = 0;
      }
    }
  };

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
    const { upsertTask } = useTaskMutations();
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

  const toggleHideCompleted = () => {
    setHideCompletedTasks(prev => {
      const newState = !prev;
      localStorage.setItem('hideCompletedTasks', String(newState));
      return newState;
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

  const tasksQueryKey = ['tasks', { 
    projectIds: undefined, 
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
            onNewProjectClick={() => navigate('/request')}
            onNewTaskClick={() => onOpenTaskModal()}
            isTaskView={isTaskView}
            isGCalConnected={isGCalConnected}
            onImportClick={() => setIsImportDialogOpen(true)}
            onRefreshClick={handleRefresh}
            advancedFilters={advancedFilters}
            onAdvancedFiltersChange={setAdvancedFilters}
            allPeople={allPeople}
            allOwners={allOwners}
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
              onEditTask={(task) => onOpenTaskModal(task, undefined, project)}
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