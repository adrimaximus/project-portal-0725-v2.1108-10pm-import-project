import { useState, useEffect, useMemo, useRef } from "react";
import { Project } from "@/types";
import { useNavigate } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { PlusCircle, List, Table as TableIcon, MoreHorizontal, Trash2, CalendarPlus, RefreshCw, Calendar as CalendarIcon, Kanban, Search, Sparkles, Loader2 } from "lucide-react";
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
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { supabase } from "@/integrations/supabase/client";
import { useCreateProject } from "@/hooks/useCreateProject";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import TableView from "@/components/projects/TableView";
import ListView from "@/components/projects/ListView";
import CalendarImportView from "@/components/projects/CalendarImportView";
import KanbanView from "@/components/projects/KanbanView";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { formatInJakarta } from "@/lib/utils";
import { useProjectFilters } from "@/hooks/useProjectFilters";
import ProjectsPageHeader from "@/components/projects/ProjectsPageHeader";
import ProjectsToolbar from "@/components/projects/ProjectsToolbar";
import ProjectViewContainer from "@/components/projects/ProjectViewContainer";

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

type ViewMode = 'table' | 'list' | 'kanban' | 'calendar';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading, refetch } = useProjects();
  const [view, setView] = useState<ViewMode>(() => {
    const savedView = localStorage.getItem('project_view_mode') as ViewMode;
    return savedView || 'list';
  });
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'payment_status'>('status');
  const createProjectMutation = useCreateProject();
  const [isAiImporting, setIsAiImporting] = useState(false);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const [scrollToProjectId, setScrollToProjectId] = useState<string | null>(null);
  const initialTableScrollDone = useRef(false);

  const {
    searchTerm, setSearchTerm, dateRange, setDateRange,
    sortConfig, requestSort, sortedProjects
  } = useProjectFilters(projects);

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
    const selectedCalendarsStr = localStorage.getItem('googleCalendarSelected');
    if (!selectedCalendarsStr) return;
    const selectedCalendars = JSON.parse(selectedCalendarsStr);
    if (!Array.isArray(selectedCalendars) || selectedCalendars.length === 0) return;

    toast.info("Refreshing calendar events...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const today = new Date();
      const from = dateRange?.from || startOfMonth(today);
      const to = dateRange?.to || endOfMonth(today);
      to.setHours(23, 59, 59, 999);

      const { data: allEvents, error } = await supabase.functions.invoke('google-auth-handler', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { method: 'list-events', calendarIds: selectedCalendars, timeMin: from.toISOString(), timeMax: to.toISOString() }
      });

      if (error) throw error;
      localStorage.setItem('googleCalendarEvents', JSON.stringify(allEvents));
      setCalendarEvents(allEvents);
      toast.success(`Fetched ${allEvents.length} events!`);
    } catch (error: any) {
      toast.error("Failed to refresh events.", { description: error.message });
    }
  };

  useEffect(() => {
    const storedEvents = localStorage.getItem('googleCalendarEvents');
    if (storedEvents) setCalendarEvents(JSON.parse(storedEvents));
    
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'googleCalendarEvents') {
            const updatedEvents = localStorage.getItem('googleCalendarEvents');
            setCalendarEvents(updatedEvents ? JSON.parse(updatedEvents) : []);
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (view === 'calendar') {
      refreshCalendarEvents();
    }
  }, [dateRange, view]);

  const importableEvents = useMemo(() => {
    const importedEventIds = new Set(projects.map(p => p.origin_event_id?.substring(4)).filter(Boolean));
    return calendarEvents.filter(event => !importedEventIds.has(event.id));
  }, [projects, calendarEvents]);

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) setProjectToDelete(project);
  };

  const confirmDelete = async () => {
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

  return (
    <PortalLayout>
      <div className="flex flex-col h-full">
        <ProjectsPageHeader />
        <div className="flex-grow min-h-0">
          <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the project "{projectToDelete?.name}".</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4 flex-shrink-0">
              <CardTitle>Projects</CardTitle>
              <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
                {view === 'calendar' && (
                  <Button variant="outline" size="sm" onClick={handleAiImport} disabled={isAiImporting}>
                    {isAiImporting ? <Loader2 className="h-4 w-4 animate-spin sm:mr-2" /> : <Sparkles className="h-4 w-4 sm:mr-2" />}
                    <span className="hidden sm:inline">Ask AI to Import</span>
                  </Button>
                )}
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                    view === 'calendar' ? refreshCalendarEvents() : refetch();
                    toast.success("Data diperbarui.");
                }}>
                    <span className="sr-only">Refresh data</span>
                    <RefreshCw className="h-4 w-4" />
                </Button>
                <TooltipProvider>
                  <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="View mode">
                    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>List View</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="table" aria-label="Table view"><TableIcon className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Table View</p></TooltipContent></Tooltip>
                    <Tooltip><TooltipTrigger asChild><ToggleGroupItem value="kanban" aria-label="Kanban view"><Kanban className="h-4 w-4" /></ToggleGroupItem></TooltipTrigger><TooltipContent><p>Kanban View</p></TooltipContent></Tooltip>
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
                isLoading={isLoading}
                onDeleteProject={handleDeleteProject}
                sortConfig={sortConfig}
                requestSort={requestSort}
                rowRefs={rowRefs}
                kanbanGroupBy={kanbanGroupBy}
                importableEvents={importableEvents}
                onImportEvent={handleImportEvent}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectsPage;