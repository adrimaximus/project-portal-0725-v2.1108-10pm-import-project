import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Project, Task } from '@/types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, User as UserIcon, Linkedin, Twitter, Instagram, GitMerge, Loader2, Kanban, LayoutGrid, Table as TableIcon, Settings, Building } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { generatePastelColor, getAvatarUrl, getErrorMessage, getInitials, formatInJakarta } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PersonFormDialog from "@/components/people/PersonFormDialog";
import { Badge } from "@/components/ui/badge";
import WhatsappIcon from "@/components/icons/WhatsappIcon";
import { DuplicatePair } from "@/components/people/DuplicateContactsCard";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import PeopleKanbanView from "@/components/people/PeopleKanbanView";
import PeopleGridView from "@/components/people/PeopleGridView";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DuplicateSummaryDialog from "@/components/people/DuplicateSummaryDialog";
import MergeDialog from "@/components/people/MergeDialog";
import CompaniesView from "@/components/people/CompaniesView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import PersonListCard from "@/components/people/PersonListCard";
import { useProjectFilters } from "@/hooks/useProjectFilters";
import ProjectsToolbar from "@/components/projects/ProjectsToolbar";
import ProjectViewContainer from "@/components/projects/ProjectViewContainer";
import { useTaskMutations, UpsertTaskPayload } from "@/hooks/useTaskMutations";
import TaskFormDialog from "@/components/projects/TaskFormDialog";
import { TaskStatus } from "@/types";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleCalendarImportDialog } from "@/components/projects/GoogleCalendarImportDialog";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useCreateProject } from "@/hooks/useCreateProject";
import { Card, CardTitle } from "@/components/ui/card";
import { AdvancedFiltersState } from "@/components/projects/ProjectAdvancedFilters";

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';
type SortConfig<T> = { key: keyof T | null; direction: 'ascending' | 'descending' };

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const viewFromUrl = searchParams.get('view') as ViewMode;
  const view: ViewMode = useMemo(() => {
    if (viewFromUrl && ['table', 'list', 'kanban', 'tasks', 'tasks-kanban'].includes(viewFromUrl)) {
      return viewFromUrl;
    }
    return 'list';
  }, [viewFromUrl]);
  
  const isTaskView = view === 'tasks' || view === 'tasks-kanban';

  const { data: projectsData = [], isLoading: isLoadingProjects, refetch: refetchProjects } = useProjects({ searchTerm });

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
  
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({
    hiddenStatuses: [],
    selectedPeopleIds: [],
  });

  const allPeople = useMemo(() => {
    if (!projectsData) return [];
    const peopleMap = new Map<string, { id: string; name: string }>();
    projectsData.forEach(project => {
      project.assignedTo?.forEach(person => {
        if (!peopleMap.has(person.id)) {
          peopleMap.set(person.id, { id: person.id, name: person.name });
        }
      });
    });
    return Array.from(peopleMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projectsData]);

  const {
    dateRange, setDateRange,
    sortConfig: projectSortConfig, requestSort: requestProjectSort, sortedProjects
  } = useProjectFilters(projectsData, advancedFilters);

  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskSortConfig, setTaskSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'updated_at', direction: 'desc' });
  const [hideCompletedTasks, setHideCompletedTasks] = useState(() => localStorage.getItem('hideCompletedTasks') === 'true');

  const finalTaskSortConfig = view === 'tasks-kanban' ? { key: 'kanban_order', direction: 'asc' as const } : taskSortConfig;

  const { data: tasksData = [], isLoading: isLoadingTasks, refetch: refetchTasks } = useTasks({
    hideCompleted: hideCompletedTasks,
    sortConfig: finalTaskSortConfig,
  });

  const tasksQueryKey = ['tasks', { 
    projectIds: undefined, 
    hideCompleted: hideCompletedTasks, 
    sortConfig: finalTaskSortConfig 
  }];

  const refetch = useCallback(() => {
    if (isTaskView) {
      refetchTasks();
    } else {
      refetchProjects();
    }
  }, [isTaskView, refetchTasks, refetchProjects]);

  const { upsertTask, isUpserting, deleteTask, toggleTaskCompletion, isToggling } = useTaskMutations(refetch);

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

  const allTasks = useMemo(() => {
    if (isTaskView) {
      return tasksData || [];
    }
    if (!projectsData) return [];
    return projectsData.flatMap(p => p.tasks || []);
  }, [projectsData, tasksData, isTaskView]);

  const filteredTasks = useMemo(() => {
    let tasksToFilter = allTasks;
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
  }, [allTasks, taskSearchTerm]);

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

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (deletedProjectId) => {
      const deletedProject = projectsData.find(p => p.id === deletedProjectId);
      toast.success(`Project "${deletedProject?.name || 'Project'}" has been deleted.`);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any, deletedProjectId) => {
      const deletedProject = projectsData.find(p => p.id === deletedProjectId);
      toast.error(`Failed to delete project "${deletedProject?.name || 'Project'}".`, { description: getErrorMessage(error) });
    }
  });

  const handleDeleteProject = (projectId: string) => {
    const project = projectsData.find(p => p.id === projectId);
    if (project) setProjectToDelete(project);
  };

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  const handleRefresh = () => {
    toast.info("Refreshing data...");
    refetch();
  };

  const requestTaskSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (taskSortConfig.key === key && taskSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setTaskSortConfig({ key, direction });
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
            advancedFilters={advancedFilters}
            onAdvancedFiltersChange={setAdvancedFilters}
            allPeople={allPeople}
          />
        </div>
        <div ref={scrollContainerRef} className="flex-grow min-h-0 overflow-y-auto">
          <div className="p-0 data-[view=kanban]:px-4 data-[view=kanban]:pb-4 data-[view=kanban]:md:px-6 data-[view=kanban]:md:pb-6 data-[view=tasks-kanban]:p-0" data-view={view}>
            <ProjectViewContainer
              view={view}
              projects={sortedProjects}
              tasks={filteredTasks}
              isLoading={isLoadingProjects}
              isTasksLoading={isLoadingTasks}
              onDeleteProject={handleDeleteProject}
              sortConfig={projectSortConfig}
              requestSort={(key) => requestProjectSort(key as keyof Project)}
              rowRefs={rowRefs}
              kanbanGroupBy={kanbanGroupBy}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleTaskCompletion={handleToggleTaskCompletion}
              isToggling={isToggling}
              taskSortConfig={taskSortConfig}
              requestTaskSort={requestTaskSort}
              refetch={refetch}
              tasksQueryKey={tasksQueryKey}
            />
          </div>
        </div>
      </Card>
    </PortalLayout>
  );
};

export default ProjectsPage;