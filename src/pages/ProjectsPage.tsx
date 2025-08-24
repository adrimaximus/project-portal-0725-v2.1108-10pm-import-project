import { useState, useEffect, useMemo } from "react";
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
import { startOfMonth, endOfMonth } from "date-fns";

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [kanbanGroupBy, setKanbanGroupBy] = useState<'status' | 'payment_status'>('status');
  const createProjectMutation = useCreateProject();
  const [sortConfig, setSortConfig] = useState<{ key: keyof Project | null; direction: 'ascending' | 'descending' }>({ key: 'start_date', direction: 'descending' });
  const [isAiImporting, setIsAiImporting] = useState(false);

  const handleViewChange = (newView: ViewMode | null) => {
    if (newView) {
      setView(newView);
      localStorage.setItem('project_view_mode', newView);
    }
  };

  const refreshCalendarEvents = async (range: DateRange | undefined) => {
    const token = localStorage.getItem('googleCalendarToken');
    const selectedCalendarsStr = localStorage.getItem('googleCalendarSelected');
    
    if (!token) {
      toast.error("Google Calendar is not connected or session expired. Please connect in settings.");
      return;
    }
    if (!selectedCalendarsStr) {
      toast.info("No calendars selected to refresh.");
      return;
    }

    const selectedCalendars = JSON.parse(selectedCalendarsStr);
    if (!Array.isArray(selectedCalendars) || selectedCalendars.length === 0) {
      toast.info("No calendars selected to refresh.");
      return;
    }

    toast.info("Refreshing calendar events for the selected range...");
    try {
      const today = new Date();
      const from = range?.from || startOfMonth(today);
      const to = range?.to || endOfMonth(today);
      to.setHours(23, 59, 59, 999);

      const timeMin = from.toISOString();
      const timeMax = to.toISOString();
      
      const allEvents: any[] = [];

      for (const calendarId of selectedCalendars) {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 401) {
            toast.error("Authentication expired. Please reconnect in settings.");
            localStorage.removeItem('googleCalendarToken');
            localStorage.removeItem('googleCalendarConnected');
            return;
        }
        if (!response.ok) {
            throw new Error(`Failed to fetch events for calendar ${calendarId}`);
        }
        
        const data = await response.json();
        if (data.items) allEvents.push(...data.items);
      }
      
      allEvents.sort((a, b) => {
        const dateA = new Date(a.start.dateTime || a.start.date);
        const dateB = new Date(b.start.dateTime || b.start.date);
        return dateA.getTime() - dateB.getTime();
      });

      localStorage.setItem('googleCalendarEvents', JSON.stringify(allEvents));
      setCalendarEvents(allEvents);
      toast.success(`Successfully fetched ${allEvents.length} events!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to refresh events. Please try reconnecting in settings.");
    }
  };

  useEffect(() => {
    const storedEvents = localStorage.getItem('googleCalendarEvents');
    if (storedEvents) {
      try {
        setCalendarEvents(JSON.parse(storedEvents));
      } catch (e) {
        console.error("Failed to parse calendar events from localStorage", e);
        setCalendarEvents([]);
      }
    }
    
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'googleCalendarEvents') {
            const updatedEvents = localStorage.getItem('googleCalendarEvents');
            setCalendarEvents(updatedEvents ? JSON.parse(updatedEvents) : []);
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (view === 'calendar') {
      refreshCalendarEvents(dateRange);
    }
  }, [dateRange, view]);

  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);

      const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
      toDate.setHours(23, 59, 59, 999);

      filtered = filtered.filter(project => {
        if (!project.start_date && !project.due_date) {
          return false;
        }
        
        const projectStart = project.start_date ? new Date(project.start_date) : null;
        const projectEnd = project.due_date ? new Date(project.due_date) : projectStart;

        if (projectStart && projectEnd) {
          return projectStart <= toDate && projectEnd >= fromDate;
        }
        if (projectStart) {
          return projectStart >= fromDate && projectStart <= toDate;
        }
        if (projectEnd) {
          return projectEnd >= fromDate && projectEnd <= toDate;
        }

        return false;
      });
    }

    if (searchTerm.trim() !== "") {
      const lowercasedFilter = searchTerm.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(lowercasedFilter) ||
        (project.description && project.description.toLowerCase().includes(lowercasedFilter))
      );
    }

    return filtered;
  }, [projects, dateRange, searchTerm]);

  const sortedProjects = useMemo(() => {
    let sortableItems = [...filteredProjects];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        } else if (sortConfig.key === 'start_date' || sortConfig.key === 'due_date') {
            const dateA = new Date(aValue as string).getTime();
            const dateB = new Date(bValue as string).getTime();
            if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
        } else {
            const stringA = String(aValue).toLowerCase();
            const stringB = String(bValue).toLowerCase();
            if (stringA < stringB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (stringA > stringB) return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProjects, sortConfig]);

  const importableEvents = useMemo(() => {
    const importedEventIds = new Set(
      projects
        .map(p => p.origin_event_id)
        .filter(id => id && id.startsWith('cal-'))
        .map(id => id.substring(4))
    );
    return calendarEvents.filter(event => !importedEventIds.has(event.id));
  }, [projects, calendarEvents]);

  const requestSort = (key: keyof Project) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setProjectToDelete(project);
    }
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id);

      if (error) {
        toast.error(`Failed to delete project "${projectToDelete.name}".`);
        console.error(error);
      } else {
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

    const isAllDay = event.start.date && !event.start.dateTime;
    
    const finalStartDate = isAllDay ? new Date(startDateStr + 'T00:00:00Z') : new Date(startDateStr);
    let finalDueDate;

    if (isAllDay) {
        const endDate = new Date(dueDateStr + 'T00:00:00Z');
        endDate.setUTCDate(endDate.getUTCDate() - 1);
        finalDueDate = endDate;
    } else {
        finalDueDate = new Date(dueDateStr);
    }

    const newProjectData = {
      name: event.summary || "Untitled Event",
      category: 'Imported Event',
      startDate: finalStartDate.toISOString(),
      dueDate: finalDueDate.toISOString(),
      origin_event_id: `cal-${event.id}`,
      venue: event.location,
    };

    createProjectMutation.mutate(newProjectData, {
        onSuccess: () => {
            setCalendarEvents(prev => prev.filter(e => e.id !== event.id));
        },
        onError: (error) => {
            if (error.message.includes('duplicate key value violates unique constraint')) {
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
      const { data, error } = await supabase.functions.invoke('openai-generator', {
        body: {
          feature: 'ai-select-calendar-events',
          payload: {
            events: importableEvents,
            existingProjects: projects.map(p => p.name),
          }
        }
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

  const renderContent = () => {
    switch (view) {
      case 'table':
        return <TableView projects={sortedProjects} isLoading={isLoading} onDeleteProject={handleDeleteProject} sortConfig={sortConfig} requestSort={requestSort} />;
      case 'list':
        return <ListView projects={sortedProjects} onDeleteProject={handleDeleteProject} />;
      case 'kanban':
        return <KanbanView projects={filteredProjects} groupBy={kanbanGroupBy} />;
      case 'calendar':
        return <CalendarImportView events={importableEvents} onImportEvent={handleImportEvent} />;
      default:
        return null;
    }
  };

  return (
    <PortalLayout>
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h1 className="text-3xl font-bold tracking-tight">All Projects</h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/request')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
        <div className="flex-grow min-h-0">
          <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the project "{projectToDelete?.name}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4 gap-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <CardTitle>Projects</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {view === 'calendar' && (
                  <Button variant="outline" size="sm" onClick={handleAiImport} disabled={isAiImporting}>
                    {isAiImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Ask AI to Import
                  </Button>
                )}
                {view !== 'calendar' && (
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                      refetch();
                      toast.success("Data proyek berhasil diperbarui.");
                  }}>
                      <span className="sr-only">Refresh projects data</span>
                      <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                {view === 'calendar' && (
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => refreshCalendarEvents(dateRange)}>
                    <span className="sr-only">Refresh calendar events</span>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <TooltipProvider>
                  <ToggleGroup 
                    type="single" 
                    value={view} 
                    onValueChange={handleViewChange}
                    aria-label="View mode"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem value="list" aria-label="List view">
                          <List className="h-4 w-4" />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent><p>List View</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem value="table" aria-label="Table view">
                          <TableIcon className="h-4 w-4" />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent><p>Table View</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem value="kanban" aria-label="Kanban view">
                          <Kanban className="h-4 w-4" />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent><p>Kanban View</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ToggleGroupItem value="calendar" aria-label="Calendar Import view">
                          <CalendarPlus className="h-4 w-4" />
                        </ToggleGroupItem>
                      </TooltipTrigger>
                      <TooltipContent><p>Calendar Import</p></TooltipContent>
                    </Tooltip>
                  </ToggleGroup>
                </TooltipProvider>
              </div>
            </CardHeader>
            <div className="px-6 py-4 flex flex-col md:flex-row md:flex-wrap gap-4 items-center flex-shrink-0 border-b">
              <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
              {view === 'kanban' && (
                <ToggleGroup 
                    type="single" 
                    value={kanbanGroupBy} 
                    onValueChange={(value) => { if (value) setKanbanGroupBy(value as 'status' | 'payment_status')}}
                    className="h-10"
                >
                    <ToggleGroupItem value="status" className="text-sm px-3">By Project Status</ToggleGroupItem>
                    <ToggleGroupItem value="payment_status" className="text-sm px-3">By Payment Status</ToggleGroupItem>
                </ToggleGroup>
              )}
              <div className="relative w-full md:w-auto md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {view === 'kanban' ? (
              <CardContent className="flex-grow min-h-0 p-4 md:p-6">
                {renderContent()}
              </CardContent>
            ) : (
              <CardContent className="flex-grow min-h-0 overflow-y-auto p-0">
                {renderContent()}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProjectsPage;