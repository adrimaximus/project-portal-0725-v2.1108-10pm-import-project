import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Project, ProjectStatus, PaymentStatus } from "@/types";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { List, CalendarDays, Table as TableIcon, MoreHorizontal, Trash2, CalendarPlus, RefreshCw } from "lucide-react";
import ProjectsList from "./ProjectsList";
import ProjectsMonthView from "./ProjectsMonthView";
import { Button } from "./ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { DatePickerWithRange } from "./ui/date-picker-with-range";
import CalendarEventsList from "./CalendarEventsList";
import StatusBadge from "./StatusBadge";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getStatusStyles } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
import { useQueryClient } from "@tanstack/react-query";

interface CalendarEvent {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string; };
    end: { dateTime?: string; date?: string; };
    htmlLink: string;
}

type ViewMode = 'table' | 'list' | 'month' | 'calendar';

const ProjectsTable = () => {
  const [view, setView] = useState<ViewMode>('table');
  const { data: localProjects = [], isLoading, refetch } = useProjects();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const refreshCalendarEvents = async () => {
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

    toast.info("Refreshing calendar events...");
    try {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Next 30 days
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
      toast.success(`Successfully refreshed ${allEvents.length} events!`);
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

  const filteredProjects = useMemo(() => {
    if (!dateRange || !dateRange.from) {
      return localProjects;
    }

    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
    toDate.setHours(23, 59, 59, 999);

    return localProjects.filter(project => {
      if (!project.startDate && !project.dueDate) {
        return false;
      }
      
      const projectStart = project.startDate ? new Date(project.startDate) : null;
      const projectEnd = project.dueDate ? new Date(project.dueDate) : projectStart;

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
  }, [localProjects, dateRange]);

  const filteredCalendarEvents = useMemo(() => {
    if (!dateRange || !dateRange.from) {
      return calendarEvents;
    }

    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
    toDate.setHours(23, 59, 59, 999);

    return calendarEvents.filter(event => {
      const startStr = event.start.dateTime || event.start.date;
      if (!startStr) return false;

      const eventStart = new Date(startStr);

      const endStr = event.end.dateTime || event.end.date;
      let eventEnd;
      if (event.end.date) {
          eventEnd = new Date(new Date(event.end.date).getTime() - 1);
      } else if (event.end.dateTime) {
          eventEnd = new Date(event.end.dateTime);
      } else {
          eventEnd = new Date(eventStart);
          eventEnd.setHours(23, 59, 59, 999);
      }
      
      return eventStart <= toDate && eventEnd >= fromDate;
    });
  }, [calendarEvents, dateRange]);

  const handleDeleteProject = (projectId: string) => {
    const project = localProjects.find(p => p.id === projectId);
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
    if (!user) {
        toast.error("You must be logged in to import events.");
        return;
    }

    const startDate = event.start.date || event.start.dateTime?.split('T')[0];
    const dueDate = event.end.date || event.end.dateTime?.split('T')[0] || startDate;

    if (!startDate) {
        toast.error("Cannot import event without a start date.");
        return;
    }

    const originEventId = `cal-${event.id}`;
    const { data: existing, error: checkError } = await supabase
        .from('projects')
        .select('id')
        .eq('origin_event_id', originEventId)
        .maybeSingle();

    if (checkError) {
        toast.error(`Error checking for existing project: ${checkError.message}`);
        return;
    }

    if (existing) {
        toast.info(`"${event.summary}" has already been imported.`);
        setCalendarEvents(prev => prev.filter(e => e.id !== event.id));
        return;
    }

    const newProjectData = {
      name: event.summary || "Untitled Event",
      category: 'Imported Event' as const,
      status: 'Requested' as ProjectStatus,
      progress: 0,
      budget: 0,
      start_date: startDate,
      due_date: dueDate,
      payment_status: 'Proposed' as PaymentStatus,
      created_by: user.id,
      origin_event_id: originEventId,
    };

    const { error } = await supabase.from('projects').insert([newProjectData]);

    if (error) {
        toast.error(`Failed to import "${event.summary}": ${error.message}`);
    } else {
        toast.success(`"${event.summary}" imported as a new project.`);
        setCalendarEvents(prev => prev.filter(e => e.id !== event.id));
        
        // Invalidate cache and refetch data to ensure UI updates
        await queryClient.invalidateQueries({ queryKey: ['projects'] });
        await refetch();
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'table':
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Loading projects...
                  </TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell style={{ borderLeft: `4px solid ${getStatusStyles(project.status).hex}` }}>
                      <Link to={`/projects/${project.slug}`} className="font-medium text-primary hover:underline">
                        {project.name}
                      </Link>
                      <div className="text-sm text-muted-foreground">{project.category}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={project.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="h-2" />
                        <span className="text-sm text-muted-foreground">{project.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {project.dueDate ? format(new Date(project.dueDate), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={project.paymentStatus} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleDeleteProject(project.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Hapus Proyek</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        );
      case 'list':
        return <ProjectsList projects={filteredProjects} onDeleteProject={handleDeleteProject} />;
      case 'month':
        return <ProjectsMonthView projects={filteredProjects} />;
      case 'calendar':
        return <CalendarEventsList events={filteredCalendarEvents} onImportEvent={handleImportEvent} />;
      default:
        return null;
    }
  };

  return (
    <>
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 gap-4">
          <div className="flex items-center gap-2">
            <CardTitle>Projects</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {view === 'table' && (
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                  refetch();
                  toast.success("Data proyek berhasil diperbarui.");
              }}>
                  <span className="sr-only">Refresh projects data</span>
                  <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {view === 'calendar' && (
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={refreshCalendarEvents}>
                <span className="sr-only">Refresh calendar events</span>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <ToggleGroup 
              type="single" 
              value={view} 
              onValueChange={(value) => {
                if (value) setView(value as ViewMode);
              }}
              aria-label="View mode"
            >
              <ToggleGroupItem value="table" aria-label="Table view">
                <TableIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="month" aria-label="Month view">
                <CalendarDays className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="calendar" aria-label="Calendar Import view">
                <CalendarPlus className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
          {(view === 'table' || view === 'list' || view === 'calendar' || view === 'month') && (
            <div className="py-4">
              <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            </div>
          )}
          {renderContent()}
        </CardContent>
      </Card>
    </>
  );
};

export default ProjectsTable;