import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, Task } from '@/types';
import ProjectsToolbar from '@/components/projects/ProjectsToolbar';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import ProjectList from '@/components/projects/ProjectList';
import ProjectKanban from '@/components/projects/ProjectKanban';
import ProjectTasksList from '@/components/projects/ProjectTasksList';
import { PageHeader, PageHeaderDescription, PageHeaderHeading } from '@/components/PageHeader';

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';
type TaskSortBy = 'created_at' | 'due_date' | 'priority' | 'title' | 'kanban_order';

const fetchProjects = async () => {
  const { data, error } = await supabase.rpc('get_dashboard_projects', { p_limit: 100, p_offset: 0 });
  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error(error.message);
  }
  return data as Project[] || [];
};

const fetchTasks = async (projectIds: string[], completed: boolean | null, sortBy: TaskSortBy, sortDirection: 'asc' | 'desc') => {
  if (projectIds.length === 0) return [];
  const { data, error } = await supabase.rpc('get_project_tasks', {
    p_project_ids: projectIds,
    p_completed: completed,
    p_order_by: sortBy,
    p_order_direction: sortDirection,
  });
  if (error) {
    console.error('Error fetching tasks:', error);
    throw new Error(error.message);
  }
  return data as Task[] || [];
};

const ProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const view = (searchParams.get('view') as ViewMode) || 'list';
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'payment_status'>('status');
  const [hideCompletedTasks, setHideCompletedTasks] = useState(false);

  const [taskSort, setTaskSort] = useState<{ by: TaskSortBy; direction: 'asc' | 'desc' }>(() => {
    try {
      const savedSort = localStorage.getItem('taskSortPreference');
      if (savedSort) {
        const parsed = JSON.parse(savedSort);
        if (parsed.by && parsed.direction) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to parse task sort preference from localStorage", e);
    }
    return { by: 'created_at', direction: 'desc' };
  });

  useEffect(() => {
    try {
      localStorage.setItem('taskSortPreference', JSON.stringify(taskSort));
    } catch (e) {
      console.error("Failed to save task sort preference to localStorage", e);
    }
  }, [taskSort]);

  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const projectIds = useMemo(() => projects?.map(p => p.id) || [], [projects]);

  const { data: tasks, isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['tasks', projectIds, hideCompletedTasks, taskSort],
    queryFn: () => fetchTasks(projectIds, hideCompletedTasks ? false : null, taskSort.by, taskSort.direction),
    enabled: !!projects && (view === 'tasks' || view === 'tasks-kanban'),
  });

  const handleViewChange = (newView: ViewMode | null) => {
    if (newView) {
      setSearchParams({ view: newView });
    }
  };

  const handleTaskSortChange = (by: TaskSortBy, direction: 'asc' | 'desc') => {
    setTaskSort({ by, direction });
  };

  const renderContent = () => {
    if (isLoadingProjects) return <div className="text-center p-8">Memuat proyek...</div>;
    if (!projects) return <div className="text-center p-8">Tidak ada proyek yang ditemukan.</div>;

    switch (view) {
      case 'list':
      case 'table':
        return <ProjectList projects={projects} />;
      case 'kanban':
        return <ProjectKanban projects={projects} groupBy={kanbanGroupBy} />;
      case 'tasks':
      case 'tasks-kanban':
        return <ProjectTasksList tasks={tasks || []} isLoading={isLoadingTasks} />;
      default:
        return <ProjectList projects={projects} />;
    }
  };

  return (
    <div className="container mx-auto px-0 sm:px-4 lg:px-6 py-4">
      <PageHeader>
        <div className="flex items-center justify-between px-4 sm:px-0">
          <div>
            <PageHeaderHeading>Proyek</PageHeaderHeading>
            <PageHeaderDescription>Kelola proyek dan tugas Anda.</PageHeaderDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Proyek Baru
          </Button>
        </div>
      </PageHeader>
      
      <ProjectsToolbar
        view={view}
        onViewChange={handleViewChange}
        kanbanGroupBy={kanbanGroupBy}
        onKanbanGroupByChange={setKanbanGroupBy}
        hideCompletedTasks={hideCompletedTasks}
        onToggleHideCompleted={() => setHideCompletedTasks(!hideCompletedTasks)}
        taskSortBy={taskSort.by}
        taskSortDirection={taskSort.direction}
        onTaskSortChange={handleTaskSortChange}
      />

      <div className="mt-4">
        {renderContent()}
      </div>

      <CreateProjectDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => {
          toast.success('Proyek berhasil dibuat!');
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }}
      />
    </div>
  );
};

export default ProjectsPage;