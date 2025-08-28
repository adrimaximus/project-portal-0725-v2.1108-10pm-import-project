import { useState, useEffect, useMemo, useRef } from "react";
import { Project } from "@/types";
import { useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { PlusCircle, List, Table as TableIcon, MoreHorizontal, Trash2, CalendarPlus, RefreshCw, Calendar as CalendarIcon, Kanban, Search, Sparkles, Loader2, ListChecks } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import TableView from "@/components/projects/TableView";
import ListView from "@/components/projects/ListView";
import CalendarImportView from "@/components/projects/CalendarImportView";
import KanbanView from "@/components/projects/KanbanView";
import { format } from "date-fns";
import { formatInJakarta } from "@/lib/utils";
import { useProjectFilters } from "@/hooks/useProjectFilters";
import ProjectsPageHeader from "@/components/projects/ProjectsPageHeader";
import ProjectsToolbar from "@/components/projects/ProjectsToolbar";
import ProjectViewContainer from "@/components/projects/ProjectViewContainer";
import { useTasks } from "@/hooks/useTasks";
import { useTaskMutations, UpsertTaskPayload } from "@/hooks/useTaskMutations";
import TaskFormDialog from "@/components/projects/TaskFormDialog";
import { Task } from "@/types/task";

interface CalendarEvent {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string; };
    end: { dateTime?: string; date?: string; };
    htmlLink: string;
    status: string;
    location?: string;
    description?: string;
}

type ViewMode = 'table' | 'list' | 'kanban' | 'calendar' | 'tasks';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading, refetch } = useProjects();
  const [view, setView] = useState<ViewMode>(() => {
    const savedView = localStorage.getItem('project_view_mode') as ViewMode;
    return savedView || 'list';
  });
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'payment_status'>('status');
  const createProjectMutation = useCreateProject();
  const [isAiImporting, setIsAiImporting] = useState(false);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const [scrollToProjectId, setScrollToProjectId] = useState<string | null>(null);
  const initialTableScrollDone = useRef(false);

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { upsertTask, isUpserting, deleteTask } = useTaskMutations();

  const {
    searchTerm, setSearchTerm, dateRange, setDateRange,
    sortConfig, requestSort, sortedProjects
  } = useProjectFilters(projects);

  const [taskSortConfig, setTaskSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'due_date', direction: 'asc' });

  const projectIds = useMemo(() => projects.map(p => p.id), [projects]);
  const { tasks, loading: tasksLoading, refetch: refetchTasks } = useTasks({ 
    projectIds: view === 'tasks' ? undefined : [],
    orderBy: taskSortConfig.key,
    orderDirection: taskSortConfig.direction,
  });

  useEffect(() => {
    if (view === 'table' && !initialTableScrollDone.current && sortedProjects.length > 0) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
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
      setView(newView);
      localStorage.setItem('project_view_mode', newView);
    }
  };

  const refreshCalendarEvents = async () => {
    toast.info("Refreshing calendar events...");
    try {
      const { data, error } = await supabase.from('calendar_events').select('*').order('start_time', { ascending: true });
      if (error) throw error;
      setCalendarEvents(data);
      toast.success(`Fetched ${data.length} events!`);
    } catch (error: any) {
      toast.error("Failed to refresh events.", { description: error.message });
    }
  };

  useEffect(() => {
    if (view === 'calendar') {
      refreshCalendarEvents();
    }
  }, [view]);

  const importableEvents = useMemo(() => {
    const importedEventIds = new Set(projects.map(p => p.origin_event_id?.substring(4)).filter(Boolean));
    return calendarEvents.filter(event => !importedEventIds.has(event.id));
  }, [projects, calendarEvents]);

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

  const handleImportEvent = async (event: CalendarEvent) => {
    const startDateStr = event.start.date || event.start.dateTime;
    let dueDateStr = event.end.date || event.end.dateTime || startDateStr;
    if (!startDateStr) {
        toast.error("Cannot import event without a start date.");
        return;
    }
    const isAllDay = !!event.start.date;
    const finalStartDate = new Date(startDateStr);
    let finalDueDate = new Date(dueDateStr);
    if (isAllDay) finalDueDate.setDate(finalDueDate.getDate() - 1);

    createProjectMutation.mutate({
      name: event.summary || "Untitled Event",
      category: 'Imported Event',
      startDate: finalStartDate.toISOString(),
      dueDate: finalDueDate.toISOString(),
      origin_event_id: `cal-${event.id}`,
      venue: event.location,
    }, {
      onSuccess: () => setCalendarEvents(prev => prev.filter(e => e.id !== event.id)),
      onError: (error) => {
        if (error.message.includes('duplicate key')) {
          toast.info(`"${event.summary}" has already been imported.`);
          setCalendarEvents(prev => prev.filter(e => e.id !== event.id));
        }
      }
    });
  };

  const handleAiImport = async () => {
    if (importableEvents.length === 0) {
      toast.info("No new calendar events to analyze.");
      return;
    }
    setIsAiImporting(true);
    toast.info("AI is analyzing your calendar events...");
    try {
      const { data, error } = await supabase.functions.invoke('ai-handler', {
        body: { feature: 'ai-select-calendar-events', payload: { events: importableEvents, existingProjects: projects.map(p => p.name) } }
      });
      if (error) throw error;
      const { event_ids_to_import } = data.result;
      if (!event_ids_to_import || event_ids_to_import.length === 0) {
        toast.success("AI analysis complete. No new projects were found to import.");
        return;
      }
      toast.info(`AI has selected ${event_ids_to_import.length} event(s) to import. Starting import...`);
      const eventsToImport = importableEvents.filter(e => event_ids_to_import.includes(e.id));
      await Promise.all(eventsToImport.map(event => handleImportEvent(event)));
      toast.success(`Successfully imported ${eventsToImport.length} new project(s)!`);
    } catch (error: any) {
      toast.error("AI import failed.", { description: error.message });
    } finally {
      setIsAiImporting(false);
    }
  };

  const handleRefresh = () => {
    switch (view) {
      case 'calendar':
        refreshCalendarEvents();
        break;
      case 'tasks':
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

  // Task handlers
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

  return (
    <PortalLayout>
      <div className="flex flex-col h-full">
        <ProjectsPageHeader />
        <div className="flex-grow min-h-0">
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

          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4 flex-shrink-0">
              <CardTitle>Projects</CardTitle>
              <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
                {view === 'tasks' && (
                  <Button size="sm" onClick={handleCreateTask}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                )}
                {view === 'calendar' && (
                  <Button variant="outline" size="sm" onClick={handleAiImport} disabled={isAiImporting}>
                    {isAiImporting ? <Loader2 className="h-4 w-4 animate-spin sm:mr-2" /> : <Sparkles className="h-4 w-4 sm:mr-2" />}
                    <span className="hidden sm:inline">Ask AI to Import</span>
                  </Button>
                )}
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={handleRefresh}>
                    <span className="sr-only">Refresh data</span>
                    <RefreshCw className="h-4 w-4" />
                </Button>
                <TooltipProvider>
                  <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="View mode">
                    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>List View</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="table" aria-label="Table view"><TableIcon className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Table View</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="kanban" aria-label="Kanban view"><Kanban className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Kanban View</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="tasks" aria-label="Tasks view"><ListChecks className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Tasks View</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="calendar" aria-label="Calendar Import view"><CalendarPlus className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Calendar Import</p></TooltipContent></Tooltip>
                  </ToggleGroup>
                </TooltipProvider>
              </div>
            </CardHeader>
            <ProjectsToolbar
              view={view} onViewChange={handleViewChange}
              searchTerm={searchTerm} onSearchTermChange={setSearchTerm}
              dateRange={dateRange} onDateRangeChange={setDateRange}
              kanbanGroupBy={kanbanGroupBy} onKanbanGroupByChange={setKanbanGroupBy}
              onRefreshProjects={refetch} onRefreshCalendar={refreshCalendarEvents}
              onAiImport={handleAiImport} isAiImporting={isAiImporting}
            />
            <CardContent className="flex-grow min-h-0 overflow-y-auto p-0 data-[view=kanban]:p-4 data-[view=kanban]:md:p-6" data-view={view}>
              <ProjectViewContainer
                view={view}
                projects={sortedProjects}
                tasks={tasks}
                isLoading={isLoading}
                isTasksLoading={tasksLoading}
                onDeleteProject={handleDeleteProject}
                sortConfig={sortConfig}
                requestSort={requestSort}
                rowRefs={rowRefs}
                kanbanGroupBy={kanbanGroupBy}
                importableEvents={importableEvents}
                onImportEvent={handleImportEvent}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                taskSortConfig={taskSortConfig}
                requestTaskSort={requestTaskSort}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectsPage;