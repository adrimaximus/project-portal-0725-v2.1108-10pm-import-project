import { useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import PortalLayout from '@/components/PortalLayout';
import ProjectsToolbar from '@/components/projects/ProjectsToolbar';
import ProjectViewContainer from '@/components/projects/ProjectViewContainer';
import { CreateProjectSheet } from '@/components/CreateProjectSheet';
import TaskFormDialog from '@/components/projects/TaskFormDialog';

import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useTaskMutations, UpsertTaskPayload } from '@/hooks/useTaskMutations';
import { useProjectFilters } from '@/hooks/useProjectFilters';

import { Project, Task } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

const ProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

  const view = (searchParams.get('view') as ViewMode) || 'list';
  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'payment_status'>('status');
  const [hideCompletedTasks, setHideCompletedTasks] = useState(false);
  
  const [isNewProjectSheetOpen, setIsNewProjectSheetOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { sortedProjects, sortConfig, requestSort } = useProjectFilters(projects);

  const { tasks, isFetching: isTasksLoading } = useTasks({
    completed: hideCompletedTasks ? false : undefined,
  });

  const [taskSortConfig, setTaskSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'due_date', direction: 'asc' });

  const requestTaskSort = (key: string) => {
    setTaskSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedTasks = useMemo(() => {
    let sortableItems = [...tasks];
    if (taskSortConfig.key) {
      sortableItems.sort((a, b) => {
        const key = taskSortConfig.key as keyof Task;
        // @ts-ignore
        const valA = a[key];
        // @ts-ignore
        const valB = b[key];
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (valA < valB) return taskSortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return taskSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [tasks, taskSortConfig]);

  const { upsertTask, deleteTask, updateTaskStatusAndOrder, isUpserting } = useTaskMutations();

  const handleViewChange = (newView: ViewMode | null) => {
    if (newView) setSearchParams({ view: newView });
  };

  const handleNewProjectClick = () => setIsNewProjectSheetOpen(true);
  const handleNewTaskClick = () => {
    setTaskToEdit(null);
    setIsTaskFormOpen(true);
  };
  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskFormOpen(true);
  };

  const handleUpsertTask = (data: UpsertTaskPayload) => {
    upsertTask(data, {
      onSuccess: () => {
        setIsTaskFormOpen(false);
        setTaskToEdit(null);
      }
    });
  };

  const isTaskView = view === 'tasks' || view === 'tasks-kanban';

  const { data: isGCalConnected } = useQuery({
    queryKey: ['googleCalendarConnection'],
    queryFn: async () => {
      const { data, error } = await supabase.from('google_calendar_tokens').select('user_id').limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },
  });

  const handleImportClick = () => {
    toast.info("Import from Google Calendar is not fully implemented yet.");
  };

  return (
    <PortalLayout noPadding disableMainScroll>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <ProjectViewContainer
            view={view}
            projects={sortedProjects}
            tasks={sortedTasks}
            isLoading={isLoadingProjects}
            isTasksLoading={isTasksLoading}
            onDeleteProject={() => toast.error("Delete not implemented.")}
            sortConfig={sortConfig}
            requestSort={requestSort}
            rowRefs={rowRefs}
            kanbanGroupBy={kanbanGroupBy}
            onEditTask={handleEditTask}
            onDeleteTask={deleteTask}
            onToggleTaskCompletion={(task, completed) => upsertTask({ id: task.id, project_id: task.project_id, title: task.title, completed })}
            taskSortConfig={taskSortConfig}
            requestTaskSort={requestTaskSort}
            onTaskStatusChange={(taskId, newStatus) => updateTaskStatusAndOrder({ taskId, newStatus, orderedTaskIds: sortedTasks.map(t => t.id) })}
          />
        </div>
        <ProjectsToolbar
          view={view}
          onViewChange={handleViewChange}
          kanbanGroupBy={kanbanGroupBy}
          onKanbanGroupByChange={setKanbanGroupBy}
          hideCompletedTasks={hideCompletedTasks}
          onToggleHideCompleted={() => setHideCompletedTasks(prev => !prev)}
          onNewProjectClick={handleNewProjectClick}
          onNewTaskClick={handleNewTaskClick}
          isTaskView={isTaskView}
          isGCalConnected={isGCalConnected}
          onImportClick={handleImportClick}
          onRefreshClick={() => {
            toast.info("Refreshing data...");
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
          }}
        />
      </div>
      
      <CreateProjectSheet open={isNewProjectSheetOpen} onOpenChange={setIsNewProjectSheetOpen} />
      
      <TaskFormDialog
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        onSubmit={handleUpsertTask}
        isSubmitting={isUpserting}
        task={taskToEdit}
      />
    </PortalLayout>
  );
};

export default ProjectsPage;