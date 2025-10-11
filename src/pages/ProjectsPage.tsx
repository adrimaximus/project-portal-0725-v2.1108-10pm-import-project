import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { List, LayoutGrid, Trello } from 'lucide-react';
import TasksKanbanView from '@/components/projects/TasksKanbanView';
import ProjectListView from '@/components/projects/ProjectListView';
import { cn } from '@/lib/utils';

const ProjectsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'list';

  const setView = (newView: string) => {
    setSearchParams({ view: newView });
  };

  const renderView = () => {
    switch (view) {
      case 'tasks-kanban':
        return <TasksKanbanView />;
      case 'list':
        return <ProjectListView />;
      case 'grid':
        return <div className="text-center py-10">Tampilan Grid belum diimplementasikan.</div>;
      default:
        return <div className="text-center py-10">Tampilan tidak diketahui. Silakan pilih tampilan lain.</div>;
    }
  };

  return (
    <PortalLayout>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Kelola semua proyek dan tugas Anda.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('list')} className={cn("gap-2", view === 'list' && "bg-background text-primary shadow-sm")}>
            <List className="h-4 w-4" />
            List
          </Button>
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('grid')} className={cn("gap-2", view === 'grid' && "bg-background text-primary shadow-sm")}>
            <LayoutGrid className="h-4 w-4" />
            Grid
          </Button>
          <Button variant={view === 'tasks-kanban' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('tasks-kanban')} className={cn("gap-2", view === 'tasks-kanban' && "bg-background text-primary shadow-sm")}>
            <Trello className="h-4 w-4" />
            Tasks
          </Button>
        </div>
      </div>
      {renderView()}
    </PortalLayout>
  );
};

export default ProjectsPage;