import { useState, useEffect, useMemo, useRef } from "react";
import { Project } from "@/types";
import { useNavigate, useSearchParams } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw, Search, Download } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCreateProject } from "@/hooks/useCreateProject";
import { format } from "date-fns";
import { formatInJakarta } from "@/lib/utils";
import { useProjectFilters } from "@/hooks/useProjectFilters";
import ProjectsToolbar from "@/components/projects/ProjectsToolbar";
import ProjectViewContainer from "@/components/projects/ProjectViewContainer";
import { useTasks } from "@/hooks/useTasks";
import { useTaskMutations, UpsertTaskPayload } from "@/hooks/useTaskMutations";
import TaskFormDialog from "@/components/projects/TaskFormDialog";
import { Task, TaskStatus } from "@/types";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Input } from "@/components/ui/input";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleCalendarImportDialog } from "@/components/projects/GoogleCalendarImportDialog";

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(""); // Moved from useProjectFilters
  const { data: projects = [], isLoading, refetch } = useProjects({ searchTerm }); // Pass searchTerm
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const viewFromUrl = searchParams.get('view') as ViewMode;
  const view: ViewMode = useMemo(() => {
    if (viewFromUrl && ['table', 'list', 'kanban', 'tasks', 'tasks-kanban'].includes(viewFromUrl)) {
      return viewFromUrl;
    }
    return 'list';
  }, [viewFromUrl]);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'payment_status'>('status');
  const createProjectMutation = useCreateProject();
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const [scrollToProjectId, setScrollToProjectId] = useState<string | null>(null);
  const initialTableScrollDone = useRef(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { upsertTask, isUpserting, deleteTask, toggleTaskCompletion, isToggling } = useTaskMutations();

  const {
    dateRange, setDateRange,
    sortConfig, requestSort: requestProjectSort, sortedProjects
  } = useProjectFilters(projects);

  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskSortConfig, setTaskSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'updated_at', direction: 'desc' });
  const [hideCompletedTasks, setHideCompletedTasks] = useState(() => localStorage.getItem('hideCompletedTasks') === 'true');

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
        if (error) throw new Error(error.message);
    },
    onSuccess: () => {
        toast.success("Events imported successfully as projects!");
        setIsImportDialogOpen(false);
        refetch();
    },
    onError: (error) => {
        toast.error("Failed to import events.", { description: error.message });
    }
  });

  const { tasks, loading: tasksLoading, refetch: refetchTasks } = useTasks({ 
    enabled: view === 'tasks' || view === 'tasks-kanban',
    orderBy: view === 'tasks-kanban' ? 'kanban_order' : taskSortConfig.key,
    orderDirection: view === 'tasks-kanban' ? 'asc' : taskSortConfig.direction,
  });

  const filteredTasks = useMemo(() => {
    let tasksToFilter = tasks;
    if (hideCompletedTasks) {
      tasksToFilter = tasksToFilter.filter(task => task.status !== 'Done');
    }
    if (!taskSearchTerm) return tasksToFilter;
    const lowercasedFilter = taskSearchTerm.toLowerCase();
    return tasksToFilter.filter(task => 
      task.title.toLowerCase().includes(lowercasedFilter) ||
      (task.description && task.description.toLowerCase().includes(lowercasedFilter)) ||
      (task.project_name && task.project_name.toLowerCase().includes(lowercasedFilter)) ||
      (task.project_venue && task.project_venue.toLowerCase().includes(lowercasedFilter)) ||
      (task.project_client && task.project_client.toLowerCase().includes(lowercasedFilter)) ||
      (task.project_owner?.name && task.project_owner.name.toLowerCase().includes(lowercasedFilter))
    );
  }, [tasks, taskSearchTerm, hideCompletedTasks]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-tasks-page-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_assignees' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_tags' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

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
      setSearchParams({ view: newView }, { replace: true });
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
        scrollContainerRef.current.scrollLeft = 0;
      }
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) setProjectToDelete(project);
  };

  const confirmDeleteProject = async () => {
    if (projectToDelete) {
      const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
      if (error) toast.error(`Failed to delete project "${projectToDelete.name}".`);
      else {
        toast.success(`Project "${projectToDelete.name}" has been deleted.`);
        refetch();
      }
      setProjectToDelete(null);
    }
  };

  const handleRefresh = () => {
    switch (view) {
      case 'tasks':
      case 'tasks-kanban':
        refetchTasks();
        break;
      default:
        refetch();
        break;
    }
    toast.success("Data diperbarui.");
  };

  const requestTaskSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (taskSortConfig.key === key && taskSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setTaskSortConfig({ key, direction });
  };

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        upsertTask({
            id: task.id,
            project_id: task.project_id,
            title: task.title,
            status: newStatus,
        }, {
            onSuccess: () => {
                toast.success(`Task "${task.title}" moved to ${newStatus}.`);
                refetchTasks();
            },
            onError: (error) => toast.error(`Failed to update task status: ${error.message}`),
        });
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete, {
        onSuccess: () => {
          refetchTasks();
          setTaskToDelete(null);
        }
      });
    }
  };

  const handleTaskFormSubmit = (data: UpsertTaskPayload) => {
    upsertTask(data, {
      onSuccess: () => {
        setIsTaskFormOpen(false);
        setEditingTask(null);
        refetchTasks();
      },
    });
  };

  const handleToggleTaskCompletion = (task: Task, completed: boolean) => {
    toggleTaskCompletion({ task, completed });
  };

  const toggleHideCompleted = () => {
    setHideCompletedTasks(prev => {
      const newState = !prev;
      localStorage.setItem('hideCompletedTasks', String(newState));
      return newState;
    });
  };

  const isTaskView = view === 'tasks' || view === 'tasks-kanban';

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

      <TaskFormDialog
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        onSubmit={handleTaskFormSubmit}
        isSubmitting={isUpserting}
        task={editingTask}
      />

      <GoogleCalendarImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={(events) => importEventsMutation.mutate(events)}
        isImporting={importEventsMutation.isPending}
      />

      <Card className="flex-1 flex flex-col min-h-0 rounded-none border-0 sm:border sm:rounded-lg">
        <div className="flex-shrink-0 bg-background z-10 border-b">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle>All Projects</CardTitle>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isTaskView ? "Search tasks..." : "Search projects..."}
                  value={isTaskView ? taskSearchTerm : searchTerm}
                  onChange={(e) => isTaskView ? setTaskSearchTerm(e.target.value) : setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
            </div>
          </div>
          <ProjectsToolbar
            view={view} onViewChange={handleViewChange}
            kanbanGroupBy={kanbanGroupBy} onKanbanGroupByChange={setKanbanGroupBy}
            hideCompletedTasks={hideCompletedTasks}
            onToggleHideCompleted={toggleHideCompleted}
            onNewProjectClick={() => navigate('/request')}
            onNewTaskClick={handleCreateTask}
            isTaskView={isTaskView}
            isGCalConnected={isGCalConnected}
            onImportClick={() => setIsImportDialogOpen(true)}
            onRefreshClick={handleRefresh}
          />
        </div>
        <div ref={scrollContainerRef} className="flex-grow min-h-0 overflow-y-auto">
          <div className="p-0 data-[view=kanban]:px-4 data-[view=kanban]:pb-4 data-[view=kanban]:md:px-6 data-[view=kanban]:md:pb-6 data-[view=tasks-kanban]:p-0" data-view={view}>
            <ProjectViewContainer
              view={view}
              projects={sortedProjects}
              tasks={filteredTasks}
              isLoading={isLoading}
              isTasksLoading={tasksLoading}
              onDeleteProject={handleDeleteProject}
              sortConfig={sortConfig}
              requestSort={requestProjectSort}
              rowRefs={rowRefs}
              kanbanGroupBy={kanbanGroupBy}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleTaskCompletion={handleToggleTaskCompletion}
              isToggling={isToggling}
              taskSortConfig={taskSortConfig}
              requestTaskSort={requestTaskSort}
              onTaskStatusChange={handleTaskStatusChange}
            />
          </div>
        </div>
      </Card>
    </PortalLayout>
  );
};

export default ProjectsPage;