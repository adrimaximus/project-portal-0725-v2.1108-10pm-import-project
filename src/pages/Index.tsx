import { useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

import ProjectsToolbar from '@/components/projects/ProjectsToolbar';
import TableView from '@/components/projects/TableView';
import TasksView from '@/components/projects/TasksView';
import { Project, Task } from '@/types';

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';
type SortConfig<T> = { key: keyof T | string; direction: 'asc' | 'desc' };

const fetchProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase.rpc('get_dashboard_projects', { p_limit: 500, p_offset: 0 });
  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error(error.message);
  }
  return data || [];
};

const fetchTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase.rpc('get_project_tasks');
  if (error) {
    console.error('Error fetching tasks:', error);
    throw new Error(error.message);
  }
  return data || [];
};

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

  const view = (searchParams.get('view') as ViewMode) || 'table';
  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'payment_status'>('status');
  const [hideCompletedTasks, setHideCompletedTasks] = useState(false);

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });
  const { data: tasksData, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  });

  const [projectSortConfig, setProjectSortConfig] = useState<SortConfig<Project>>({ key: 'start_date', direction: 'desc' });
  const [taskSortConfig, setTaskSortConfig] = useState<SortConfig<Task>>({ key: 'due_date', direction: 'asc' });

  const requestSort = useCallback((key: any, type: 'project' | 'task') => {
    const config = type === 'project' ? projectSortConfig : taskSortConfig;
    const setConfig = type === 'project' ? setProjectSortConfig : setTaskSortConfig;
    let direction: 'asc' | 'desc' = 'asc';
    if (config.key === key && config.direction === 'asc') {
      direction = 'desc';
    }
    setConfig({ key, direction });
  }, [projectSortConfig, taskSortConfig]);

  const sortedProjects = useMemo(() => {
    if (!projectsData) return [];
    const sortableItems = [...projectsData];
    if (projectSortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const key = projectSortConfig.key as keyof Project;
        // @ts-ignore
        const valA = a[key];
        // @ts-ignore
        const valB = b[key];
        if (valA === null) return 1;
        if (valB === null) return -1;
        if (valA < valB) {
          return projectSortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return projectSortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [projectsData, projectSortConfig]);

  const sortedTasks = useMemo(() => {
    if (!tasksData) return [];
    const sortableItems = [...tasksData];
    if (taskSortConfig.key !== null) {
        sortableItems.sort((a, b) => {
            const key = taskSortConfig.key as keyof Task;
            // @ts-ignore
            if (a[key] === null) return 1;
            // @ts-ignore
            if (b[key] === null) return -1;
            // @ts-ignore
            if (a[key] < b[key]) {
                return taskSortConfig.direction === 'asc' ? -1 : 1;
            }
            // @ts-ignore
            if (a[key] > b[key]) {
                return taskSortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }
    return sortableItems;
  }, [tasksData, taskSortConfig]);

  const filteredAndSortedTasks = useMemo(() => {
    if (hideCompletedTasks) {
      return sortedTasks.filter(task => !task.completed);
    }
    return sortedTasks;
  }, [sortedTasks, hideCompletedTasks]);

  const { mutate: toggleTaskCompletion } = useMutation({
    mutationFn: async ({ task, completed }: { task: Task, completed: boolean }) => {
      const { error } = await supabase.from('tasks').update({ completed }).eq('id', task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Task updated.');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      toast.error(`Error updating task: ${error.message}`);
    }
  });

  const handleViewChange = (newView: ViewMode | null) => {
    if (newView) setSearchParams({ view: newView });
  };

  const isTaskView = view === 'tasks' || view === 'tasks-kanban';

  const renderView = () => {
    switch (view) {
      case 'table':
        return <TableView 
          projects={sortedProjects} 
          isLoading={isLoadingProjects}
          onDeleteProject={() => toast.error("Delete not implemented.")}
          sortConfig={projectSortConfig}
          requestSort={(key) => requestSort(key, 'project')}
          rowRefs={rowRefs}
        />;
      case 'tasks':
        return <TasksView 
          tasks={filteredAndSortedTasks} 
          isLoading={isLoadingTasks}
          onEdit={() => toast.info("Edit not implemented.")}
          onDelete={() => toast.error("Delete not implemented.")}
          // @ts-ignore
          onToggleTaskCompletion={toggleTaskCompletion}
          sortConfig={taskSortConfig}
          requestSort={(key) => requestSort(key, 'task')}
        />;
      default:
        return (
          <div className="p-8 text-center">
            <p>View '{view}' not implemented.</p>
            <p>Please select another view.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {renderView()}
        </div>
        <ProjectsToolbar
          view={view}
          onViewChange={handleViewChange}
          kanbanGroupBy={kanbanGroupBy}
          onKanbanGroupByChange={setKanbanGroupBy}
          hideCompletedTasks={hideCompletedTasks}
          onToggleHideCompleted={() => setHideCompletedTasks(prev => !prev)}
          onNewProjectClick={() => toast.info("New project form not implemented.")}
          onNewTaskClick={() => toast.info("New task form not implemented.")}
          isTaskView={isTaskView}
          isGCalConnected={false}
          onImportClick={() => {}}
          onRefreshClick={() => {
            toast.info("Refreshing data...");
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
          }}
        />
      </main>
      <Toaster />
    </div>
  );
};

export default Index;