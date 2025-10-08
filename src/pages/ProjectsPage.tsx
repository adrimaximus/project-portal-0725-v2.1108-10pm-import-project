import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";

import { Project, Task } from "@/types";
import PageHeader from "@/components/PageHeader";
import ProjectsToolbar from "@/components/projects/ProjectsToolbar";
import ProjectList from "@/components/projects/ProjectList";
import ProjectTable from "@/components/projects/ProjectTable";
import ProjectKanban from "@/components/projects/ProjectKanban";
import TasksList from "@/components/projects/TasksList";
import TasksKanban from "@/components/projects/TasksKanban";
import ProjectSheet from "@/components/projects/ProjectSheet";
import TaskSheet from "@/components/projects/TaskSheet";
import { toast } from "sonner";

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

const ProjectsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ViewMode>((searchParams.get('view') as ViewMode) || 'list');
  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'payment_status'>('status');
  const [hideCompletedTasks, setHideCompletedTasks] = useState(false);
  const [isProjectSheetOpen, setIsProjectSheetOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [myProjectsOnly, setMyProjectsOnly] = useState(false);

  const { data: projects, isLoading, refetch } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_projects', { p_limit: 100, p_offset: 0 });
      if (error) throw new Error(error.message);
      return data as Project[];
    },
  });

  const { data: isGCalConnected } = useQuery<boolean>({
    queryKey: ['gcal_connected'],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.from('google_calendar_tokens').select('user_id').eq('user_id', user.id).single();
      return !!data;
    },
    enabled: !!user,
  });

  const handleViewChange = (newView: ViewMode | null) => {
    if (newView) {
      setView(newView);
      setSearchParams({ view: newView });
    }
  };

  const handleToggleMyProjectsOnly = () => {
    setMyProjectsOnly(prev => !prev);
  };

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (myProjectsOnly && user) {
      return projects.filter(p =>
        p.created_by.id === user.id ||
        p.assignedTo.some(member => member.id === user.id)
      );
    }
    return projects;
  }, [projects, myProjectsOnly, user]);

  const allTasks = useMemo(() => {
    if (!filteredProjects) return [];
    return filteredProjects.flatMap(p => (p.tasks || []).map(t => ({ ...t, projects: { id: p.id, name: p.name, slug: p.slug, status: p.status, created_by: p.created_by.id } } as Task)));
  }, [filteredProjects]);

  const filteredTasks = useMemo(() => {
    if (hideCompletedTasks) {
      return allTasks.filter(t => t.status !== 'Done');
    }
    return allTasks;
  }, [allTasks, hideCompletedTasks]);

  const handleImportFromGCal = async () => {
    toast.info("Importing from Google Calendar...");
    // Placeholder for actual import logic
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    setIsProjectSheetOpen(true);
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setIsTaskSheetOpen(true);
  };

  const isTaskView = view === 'tasks' || view === 'tasks-kanban';

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Projects" />
      <div className="flex-grow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">Loading...</div>
        ) : (
          <div className="h-full flex flex-col">
            {view === 'list' && <ProjectList projects={filteredProjects} onProjectSelect={handleProjectSelect} />}
            {view === 'table' && <ProjectTable projects={filteredProjects} onProjectSelect={handleProjectSelect} />}
            {view === 'kanban' && <ProjectKanban initialProjects={filteredProjects} groupBy={kanbanGroupBy} onProjectSelect={handleProjectSelect} />}
            {view === 'tasks' && <TasksList tasks={filteredTasks} onTaskSelect={handleTaskSelect} />}
            {view === 'tasks-kanban' && <TasksKanban initialTasks={filteredTasks} onTaskSelect={handleTaskSelect} />}
          </div>
        )}
      </div>
      <ProjectsToolbar
        view={view}
        onViewChange={handleViewChange}
        kanbanGroupBy={kanbanGroupBy}
        onKanbanGroupByChange={setKanbanGroupBy}
        hideCompletedTasks={hideCompletedTasks}
        onToggleHideCompleted={() => setHideCompletedTasks(prev => !prev)}
        onNewProjectClick={() => { setSelectedProject(null); setIsProjectSheetOpen(true); }}
        onNewTaskClick={() => { setSelectedTask(null); setIsTaskSheetOpen(true); }}
        isTaskView={isTaskView}
        isGCalConnected={isGCalConnected}
        onImportClick={handleImportFromGCal}
        onRefreshClick={refetch}
        myProjectsOnly={myProjectsOnly}
        onToggleMyProjectsOnly={handleToggleMyProjectsOnly}
      />
      <ProjectSheet
        isOpen={isProjectSheetOpen}
        onOpenChange={setIsProjectSheetOpen}
        project={selectedProject}
      />
      <TaskSheet
        isOpen={isTaskSheetOpen}
        onOpenChange={setIsTaskSheetOpen}
        task={selectedTask}
        projects={projects || []}
      />
    </div>
  );
};

export default ProjectsPage;