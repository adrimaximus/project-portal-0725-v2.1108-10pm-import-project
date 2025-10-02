import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, Task } from '@/types';
import ProjectsToolbar from '@/components/projects/ProjectsToolbar';
import ProjectsKanbanView from '@/components/projects/ProjectsKanbanView';
import ProjectsListView from '@/components/projects/ProjectsListView';
import ProjectsTableView from '@/components/projects/ProjectsTableView';
import TasksListView from '@/components/projects/TasksListView';
import TasksKanbanView from '@/components/projects/TasksKanbanView';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';
type KanbanGroupBy = 'status' | 'payment_status';
type SortConfig = { key: string; direction: 'asc' | 'desc' };

const ProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = (searchParams.get('view') as ViewMode) || 'list';
  const [kanbanGroupBy, setKanbanGroupBy] = useState<KanbanGroupBy>('status');
  const [hideCompletedTasks, setHideCompletedTasks] = useState(false);

  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const savedSortConfig = sessionStorage.getItem('tasksSortConfig');
    if (savedSortConfig) {
      return JSON.parse(savedSortConfig);
    }
    return { key: 'updated_at', direction: 'desc' };
  });

  useEffect(() => {
    sessionStorage.setItem('tasksSortConfig', JSON.stringify(sortConfig));
  }, [sortConfig]);

  const { data: projects, isLoading: projectsLoading, error: projectsError } = useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_projects', { p_limit: 100, p_offset: 0 });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: view === 'list' || view === 'table' || view === 'kanban',
  });

  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useQuery<Task[], Error>({
    queryKey: ['tasks', hideCompletedTasks, sortConfig],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_project_tasks', {
        p_completed: hideCompletedTasks ? false : null,
        p_order_by: sortConfig.key,
        p_order_direction: sortConfig.direction,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: view === 'tasks' || view === 'tasks-kanban',
  });

  const handleViewChange = (newView: ViewMode | null) => {
    if (newView) {
      setSearchParams({ view: newView });
    }
  };

  const handleSortChange = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return { key, direction: prevConfig.direction === 'asc' ? 'desc' : 'asc' };
      }
      const newDirection = ['title', 'project_name'].includes(key) ? 'asc' : 'desc';
      return { key, direction: newDirection };
    });
  };

  if (projectsError) toast.error(projectsError.message);
  if (tasksError) toast.error(tasksError.message);

  const renderView = () => {
    switch (view) {
      case 'list':
        return <ProjectsListView projects={projects || []} isLoading={projectsLoading} />;
      case 'table':
        return <ProjectsTableView projects={projects || []} isLoading={projectsLoading} />;
      case 'kanban':
        return <ProjectsKanbanView projects={projects || []} isLoading={projectsLoading} groupBy={kanbanGroupBy} />;
      case 'tasks':
        return <TasksListView 
                  tasks={tasks || []} 
                  isLoading={tasksLoading} 
                  sortConfig={sortConfig}
                  onSortChange={handleSortChange}
                />;
      case 'tasks-kanban':
        return <TasksKanbanView tasks={tasks || []} isLoading={tasksLoading} />;
      default:
        return <ProjectsListView projects={projects || []} isLoading={projectsLoading} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/40">
      <header className="flex items-center justify-between p-4 border-b bg-background">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </header>
      <ProjectsToolbar
        view={view}
        onViewChange={handleViewChange}
        kanbanGroupBy={kanbanGroupBy}
        onKanbanGroupByChange={setKanbanGroupBy}
        hideCompletedTasks={hideCompletedTasks}
        onToggleHideCompleted={() => setHideCompletedTasks(!hideCompletedTasks)}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pt-0">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default ProjectsPage;