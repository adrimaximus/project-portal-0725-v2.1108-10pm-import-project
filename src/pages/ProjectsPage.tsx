import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import MainLayout from '@/components/MainLayout';
import ProjectsToolbar from '@/components/projects/ProjectsToolbar';
import { getDashboardProjects } from '@/lib/dashboardApi';
import { Loader2 } from 'lucide-react';

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

// Placeholder component for different views
const PlaceholderView = ({ view, hideCompleted }: { view: string, hideCompleted?: boolean }) => (
  <div className="flex items-center justify-center h-full bg-muted/40 rounded-lg border-2 border-dashed border-muted-foreground/30">
    <p className="text-muted-foreground">
      This is the '{view}' view. {hideCompleted !== undefined && `Hide completed is ${hideCompleted ? 'ON' : 'OFF'}.`}
    </p>
  </div>
);

const ProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const view = (searchParams.get('view') as ViewMode) || 'list';
  const kanbanGroupBy = (searchParams.get('groupBy') as 'status' | 'payment_status') || 'status';

  const [hideCompletedTasks, setHideCompletedTasks] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hideCompletedTasks') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hideCompletedTasks', String(hideCompletedTasks));
    }
  }, [hideCompletedTasks]);

  const handleToggleHideCompleted = () => {
    const newValue = !hideCompletedTasks;
    setHideCompletedTasks(newValue);
    toast.success(`'Hide Done' is now ${newValue ? 'ON' : 'OFF'}.`);
  };

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['dashboardProjects'],
    queryFn: () => getDashboardProjects(100, 0),
  });

  const isTaskView = view === 'tasks' || view === 'tasks-kanban';

  const handleViewChange = (newView: ViewMode | null) => {
    if (newView) {
      setSearchParams({ view: newView });
    }
  };

  const handleKanbanGroupByChange = (value: 'status' | 'payment_status') => {
    setSearchParams({ view, groupBy: value });
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
    if (!projects) return <div>No projects found.</div>;

    return <PlaceholderView view={view} hideCompleted={isTaskView ? hideCompletedTasks : undefined} />;
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 80px)' }}>
        <div className="flex-grow overflow-y-auto">
          {renderContent()}
        </div>
        <ProjectsToolbar
          view={view}
          onViewChange={handleViewChange}
          kanbanGroupBy={kanbanGroupBy}
          onKanbanGroupByChange={handleKanbanGroupByChange}
          hideCompletedTasks={hideCompletedTasks}
          onToggleHideCompleted={handleToggleHideCompleted}
          onNewProjectClick={() => toast.info("New Project clicked")}
          onNewTaskClick={() => toast.info("New Task clicked")}
          isTaskView={isTaskView}
          isGCalConnected={false}
          onImportClick={() => toast.info("Import clicked")}
          onRefreshClick={refetch}
        />
      </div>
    </MainLayout>
  );
};

export default ProjectsPage;