import { useState, useEffect, useMemo } from "react";
import { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { List, CalendarDays, Table as TableIcon, MoreHorizontal, Trash2, CalendarPlus, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
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
import { DatePickerWithRange } from "./ui/date-picker-with-range";
import { supabase } from "@/integrations/supabase/client";
import { useCreateProject } from "@/hooks/useCreateProject";

import TableView from "./projects/TableView";
import ListView from "./projects/ListView";
import MonthView from "./projects/MonthView";
import CalendarImportView from "./projects/CalendarImportView";

interface CalendarEvent {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string; };
    end: { dateTime?: string; date?: string; };
    htmlLink: string;
    status: string;
}

type ViewMode = 'table' | 'list' | 'month' | 'calendar';

interface ProjectsTableProps {
  projects: Project[];
  isLoading: boolean;
  refetch: () => void;
}

const ProjectsTable = ({ projects, isLoading, refetch }: ProjectsTableProps) => {
  const [view, setView] = useState<ViewMode>('table');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const createProjectMutation = useCreateProject();

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
      return projects;
    }

    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
    toDate.setHours(23, 59, 59, 999);

    return projects.filter(project => {
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
  }, [projects, dateRange]);

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

  const renderContent = () => {
    switch (view) {
      case 'table':
        return <TableView projects={filteredProjects} isLoading={isLoading} onDeleteProject={handleDeleteProject} />;
      case 'list':
        return <ListView projects={filteredProjects} onDeleteProject={handleDeleteProject} />;
      case 'month':
        return <MonthView projects={filteredProjects} gcalEvents={filteredCalendarEvents} />;
      case 'calendar':
        return <CalendarImportView events={filteredCalendarEvents} onImportEvent={handleImportEvent} />;
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