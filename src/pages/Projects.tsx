import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getDashboardProjects, createProject, updateProjectDetails, deleteProject } from '@/api/projects';
import { getProjectTasks, upsertTask, deleteTask, toggleTaskCompletion } from '@/api/tasks';
import { getPeople } from '@/api/people';
import { Project, Task as ProjectTask, Person } from '@/types';
import { toast } from 'sonner';

import ProjectsToolbar from '@/components/projects/ProjectsToolbar';
import ProjectsGridView from '@/components/projects/ProjectsGridView';
import ProjectsListView from '@/components/projects/ProjectsListView';
import ProjectsKanbanView from '@/components/projects/ProjectsKanbanView';
import TasksView from '@/components/projects/TasksView';
import TasksKanbanView from '@/components/projects/TasksKanbanView';
import NewProjectDialog from '@/components/projects/NewProjectDialog';
import NewTaskDialog from '@/components/projects/NewTaskDialog';
import EditProjectDialog from '@/components/projects/EditProjectDialog';
import EditTaskDialog from '@/components/projects/EditTaskDialog';
import ImportFromCalendarDialog from '@/components/projects/ImportFromCalendarDialog';
import { AdvancedFiltersState } from '@/components/projects/ProjectAdvancedFilters';
import { useSession } from '@/hooks/useSession';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

const Projects = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSession();

  const view = (searchParams.get('view') as ViewMode) || 'list';
  const kanbanGroupBy = (searchParams.get('groupBy') as 'status' | 'payment_status') || 'status';
  const [hideCompletedTasks, setHideCompletedTasks] = useState(true);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<ProjectTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    status: [],
    assignees: [],
    dueDate: null,
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'updated_at', direction: 'desc' });

  const isTaskView = view === 'tasks' || view === 'tasks-kanban';

  const { data: gcalTokens } = useQuery({
    queryKey: ['gcalTokens', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('google_calendar_tokens').select('*').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });
  const isGCalConnected = !!gcalTokens;

  const { data: projectsData, isLoading: isLoadingProjects, refetch: refetchProjects } = useQuery({
    queryKey: ['projects', searchTerm],
    queryFn: () => getDashboardProjects(100, 0, searchTerm),
    enabled: !isTaskView,
  });

  const { data: tasksData, isLoading: isLoadingTasks, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', hideCompletedTasks, advancedFilters, sortConfig],
    queryFn: () => getProjectTasks({
      completed: hideCompletedTasks ? false : undefined,
      assigneeIds: advancedFilters.assignees,
      dueDateRange: advancedFilters.dueDate,
      statuses: advancedFilters.status,
      orderBy: sortConfig.key,
      orderDirection: sortConfig.direction,
    }),
    enabled: isTaskView,
  });

  const { data: peopleData } = useQuery<Person[]>({
    queryKey: ['people'],
    queryFn: getPeople,
  });

  const allPeople = peopleData || [];

  const projects = useMemo(() => projectsData || [], [projectsData]);
  const tasks = useMemo(() => tasksData || [], [tasksData]);

  const handleViewChange = (newView: ViewMode | null) => {
    if (newView) {
      setSearchParams({ view: newView });
    }
  };

  const handleKanbanGroupByChange = (value: 'status' | 'payment_status') => {
    setSearchParams({ view, groupBy: value });
  };

  const handleToggleHideCompleted = () => {
    setHideCompletedTasks(!hideCompletedTasks);
  };

  const handleRefresh = useCallback(() => {
    if (isTaskView) {
      refetchTasks();
    } else {
      refetchProjects();
    }
    toast.success("Data refreshed!");
  }, [isTaskView, refetchTasks, refetchProjects]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      toast.success("Project created successfully!");
      invalidateQueries();
      setIsNewProjectOpen(false);
    },
    onError: (error) => {
      toast.error(`Error creating project: ${error.message}`);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: updateProjectDetails,
    onSuccess: () => {
      toast.success("Project updated successfully!");
      invalidateQueries();
      setProjectToEdit(null);
    },
    onError: (error) => {
      toast.error(`Error updating project: ${error.message}`);
    },
  });

  const upsertTaskMutation = useMutation({
    mutationFn: upsertTask,
    onSuccess: () => {
      toast.success("Task saved successfully!");
      invalidateQueries();
      setIsNewTaskOpen(false);
      setTaskToEdit(null);
    },
    onError: (error) => {
      toast.error(`Error saving task: ${error.message}`);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      toast.success("Task deleted successfully!");
      invalidateQueries();
      setTaskToDelete(null);
    },
    onError: (error) => {
      toast.error(`Error deleting task: ${error.message}`);
    },
  });

  const toggleTaskCompletionMutation = useMutation({
    mutationFn: toggleTaskCompletion,
    onSuccess: () => {
      invalidateQueries();
    },
    onError: (error) => {
      toast.error(`Error updating task: ${error.message}`);
    },
  });

  return (
    <div className="flex flex-col h-full">
      <ProjectsToolbar
        view={view}
        onViewChange={handleViewChange}
        kanbanGroupBy={kanbanGroupBy}
        onKanbanGroupByChange={handleKanbanGroupByChange}
        hideCompletedTasks={hideCompletedTasks}
        onToggleHideCompleted={handleToggleHideCompleted}
        onNewProjectClick={() => setIsNewProjectOpen(true)}
        onNewTaskClick={() => setIsNewTaskOpen(true)}
        isTaskView={isTaskView}
        isGCalConnected={isGCalConnected}
        onImportClick={() => setIsImportOpen(true)}
        onRefreshClick={handleRefresh}
        advancedFilters={advancedFilters}
        onAdvancedFiltersChange={setAdvancedFilters}
        allPeople={allPeople}
      />
      <div className="flex-1 overflow-auto">
        {view === 'list' && <ProjectsListView projects={projects} isLoading={isLoadingProjects} onEdit={setProjectToEdit} />}
        {view === 'table' && <ProjectsGridView projects={projects} isLoading={isLoadingProjects} onEdit={setProjectToEdit} />}
        {view === 'kanban' && <ProjectsKanbanView initialProjects={projects} isLoading={isLoadingProjects} groupBy={kanbanGroupBy} />}
        {view === 'tasks' && (
          <TasksView
            tasks={tasks}
            isLoading={isLoadingTasks}
            onEdit={setTaskToEdit}
            onDelete={setTaskToDelete}
            onToggleTaskCompletion={(task, completed) => toggleTaskCompletionMutation.mutate({ taskId: task.id, completed })}
            isToggling={toggleTaskCompletionMutation.isPending}
            sortConfig={sortConfig}
            requestSort={requestSort}
          />
        )}
        {view === 'tasks-kanban' && <TasksKanbanView initialTasks={tasks} isLoading={isLoadingTasks} />}
      </div>

      {/* Dialogs */}
      <NewProjectDialog isOpen={isNewProjectOpen} onClose={() => setIsNewProjectOpen(false)} onSave={createProjectMutation.mutate} isLoading={createProjectMutation.isPending} />
      <NewTaskDialog isOpen={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)} onSave={upsertTaskMutation.mutate} isLoading={upsertTaskMutation.isPending} allPeople={allPeople} />
      {projectToEdit && <EditProjectDialog isOpen={!!projectToEdit} onClose={() => setProjectToEdit(null)} project={projectToEdit} onSave={updateProjectMutation.mutate} isLoading={updateProjectMutation.isPending} />}
      {taskToEdit && <EditTaskDialog isOpen={!!taskToEdit} onClose={() => setTaskToEdit(null)} task={taskToEdit} onSave={upsertTaskMutation.mutate} isLoading={upsertTaskMutation.isPending} allPeople={allPeople} />}
      <ImportFromCalendarDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImportSuccess={handleRefresh} />
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the task.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => taskToDelete && deleteTaskMutation.mutate(taskToDelete)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Projects;