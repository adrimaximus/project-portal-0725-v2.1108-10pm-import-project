import { useState, useEffect } from 'react';
import ProjectsToolbar from '@/components/projects/ProjectsToolbar';
import NewTaskDialog from '@/components/tasks/NewTaskDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

const ProjectsPage = () => {
  const [view, setView] = useState<ViewMode>('list');
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; first_name: string; last_name: string; email: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name');
      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch projects." });
      } else {
        setProjects(projectsData || []);
      }

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email');
      if (usersError) {
        console.error('Error fetching users:', usersError);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch users." });
      } else {
        setUsers(usersData || []);
      }
    };

    fetchData();
  }, [toast]);

  const handleTaskCreated = () => {
    setIsNewTaskDialogOpen(false);
    toast({
      title: "Task Created",
      description: "The new task has been successfully added.",
    });
    // In a real app, you would refetch tasks here.
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <main className="flex-1 p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-4">Projects & Tasks</h1>
        <div className="border rounded-lg h-full flex items-center justify-center bg-muted/40">
          <p className="text-muted-foreground">Content for the '{view}' view will be displayed here.</p>
        </div>
      </main>
      <ProjectsToolbar
        view={view}
        onViewChange={(v) => setView(v || 'list')}
        kanbanGroupBy="status"
        onKanbanGroupByChange={() => {}}
        hideCompletedTasks={false}
        onToggleHideCompleted={() => {}}
        onNewProjectClick={() => toast({ title: "Info", description: "Create new project functionality is not implemented yet." })}
        onNewTaskClick={() => setIsNewTaskDialogOpen(true)}
        isTaskView={view === 'tasks' || view === 'tasks-kanban'}
        isGCalConnected={false}
        onImportClick={() => {}}
        onRefreshClick={() => window.location.reload()}
      />
      <NewTaskDialog
        isOpen={isNewTaskDialogOpen}
        onOpenChange={setIsNewTaskDialogOpen}
        projects={projects}
        users={users}
        onSuccess={handleTaskCreated}
      />
    </div>
  );
};

export default ProjectsPage;