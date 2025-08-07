import { useState, useEffect, useRef } from 'react';
import { gapi } from 'gapi-script';
import { toast } from 'sonner';
import { GoogleCalendarEvent } from '@/types';
import { Project } from '@/data/projects';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, PlusCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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
import { Checkbox } from './ui/checkbox';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from './ui/card';

interface GoogleCalendarEventsViewProps {
  refreshKey: number;
  onImport: (projects: Project[]) => void;
}

const formatEventDate = (event: GoogleCalendarEvent) => {
    const start = parseISO(event.start.dateTime);
    const end = parseISO(event.end.dateTime);
    
    if (event.start.date) { // All-day event
        const adjustedEnd = new Date(end.getTime() - 1); // Adjust for exclusive end date
        if (format(start, 'yyyy-MM-dd') === format(adjustedEnd, 'yyyy-MM-dd')) {
            return format(start, 'MMM d, yyyy');
        }
        return `${format(start, 'MMM d')} - ${format(adjustedEnd, 'MMM d, yyyy')}`;
    }

    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
        return `${format(start, 'MMM d, yyyy')} ⋅ ${format(start, 'p')} - ${format(end, 'p')}`;
    }
    
    return `${format(start, 'MMM d, yyyy, p')} - ${format(end, 'MMM d, yyyy, p')}`;
};

const transformEventToProject = (event: GoogleCalendarEvent): Omit<Project, 'description' | 'paymentStatus' | 'createdBy' | 'comments' | 'activities' | 'briefFiles' | 'services'> => {
  return {
    id: uuidv4(),
    name: event.summary,
    category: 'From Calendar',
    status: 'Requested',
    progress: 0,
    budget: 0,
    startDate: event.start.dateTime || event.start.date!,
    dueDate: event.end.dateTime || event.end.date!,
    assignedTo: [],
    lastUpdated: new Date().toISOString(),
  };
};

const GoogleCalendarEventsView = ({ refreshKey, onImport }: GoogleCalendarEventsViewProps) => {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<GoogleCalendarEvent | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Record<string, boolean>>({});
  const isInitialRender = useRef(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const isRefresh = !isInitialRender.current;
      let toastId: string | number | undefined;

      if (isRefresh) {
        toastId = toast.loading("Refreshing calendar events...");
      }

      setIsLoading(true);
      setError(null);

      const gcalConnected = localStorage.getItem('gcal_connected') === 'true';
      const accessToken = localStorage.getItem('gcal_access_token');
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const storedIds = localStorage.getItem('gcal_calendar_ids');
      
      let calendarIds: string[] = [];
      if (storedIds) {
        try {
          const parsedIds = JSON.parse(storedIds);
          if (Array.isArray(parsedIds) && parsedIds.length > 0) {
            calendarIds = parsedIds;
          }
        } catch (e) { console.error("Failed to parse calendar IDs", e); }
      }

      if (!clientId) {
        setError("Error: Google Client ID is not configured in the application environment.");
        setIsLoading(false);
        if (isRefresh) toast.error("Google Client ID is not configured.", { id: toastId });
        return;
      }
      if (!gcalConnected || !accessToken) {
        setError("Google Calendar is not connected. Please connect it in the settings.");
        setIsLoading(false);
        if (isRefresh) toast.error("Google Calendar not connected.", { id: toastId });
        return;
      }
      
      if (calendarIds.length === 0) {
        setError("No calendars selected to sync. Please select calendars in the settings.");
        setIsLoading(false);
        if (isRefresh) toast.warning("No calendars selected in settings.", { id: toastId });
        return;
      }

      try {
        await new Promise<void>((resolve) => gapi.load('client', resolve));
        await gapi.client.init({
          apiKey: undefined,
          clientId: clientId,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
        });
        gapi.client.setToken({ access_token: accessToken });

        const timeMin = new Date();
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + 30);

        const requests = calendarIds.map(calendarId => 
          gapi.client.calendar.events.list({
            'calendarId': calendarId,
            'timeMin': timeMin.toISOString(),
            'timeMax': timeMax.toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 100,
            'orderBy': 'startTime'
          })
        );

        const responses = await Promise.all(requests);
        const allEvents = responses.flatMap((response, index) => {
            const calendarId = calendarIds[index];
            return response.result.items.map((item: any) => ({ ...item, calendarId }));
        });

        const formattedEvents: GoogleCalendarEvent[] = allEvents
          .map((item: any) => ({
            id: item.id,
            summary: item.summary,
            description: item.description,
            start: { dateTime: item.start.dateTime || item.start.date, timeZone: item.start.timeZone || 'UTC', date: item.start.date },
            end: { dateTime: item.end.dateTime || item.end.date, timeZone: item.end.timeZone || 'UTC', date: item.end.date },
            creator: { email: item.creator?.email || 'Unknown' },
            attendees: item.attendees,
            isGoogleEvent: true as const,
            htmlLink: item.htmlLink,
            calendarId: item.calendarId,
          }))
          .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
        
        setEvents(formattedEvents);
        if (isRefresh) {
          toast.success(`Sync complete. Found ${formattedEvents.length} events.`, { id: toastId });
        }
      } catch (err: any) {
        console.error("Error fetching Google Calendar events:", err);
        let message: string;
        if (err.result?.error?.code === 401 || err.result?.error?.code === 403) {
          message = "Google session expired. Please reconnect in settings.";
          localStorage.removeItem('gcal_connected');
          localStorage.removeItem('gcal_access_token');
        } else {
          message = "Failed to fetch calendar events.";
        }
        setError(message);
        if (isRefresh) {
          toast.error(message, { id: toastId });
        } else {
          toast.error(message);
        }
      } finally {
        setIsLoading(false);
        if (isInitialRender.current) {
          isInitialRender.current = false;
        }
      }
    };

    fetchEvents();
  }, [refreshKey]);

  const handleDelete = async () => {
    if (!eventToDelete) return;

    try {
        await gapi.client.calendar.events.delete({
            calendarId: eventToDelete.calendarId,
            eventId: eventToDelete.id,
        });

        setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
        toast.success(`Event "${eventToDelete.summary}" deleted.`);
    } catch (error: any) {
        console.error("Error deleting event:", error);
        const errorMessage = error.result?.error?.message || "Failed to delete event.";
        toast.error(errorMessage);
    } finally {
        setEventToDelete(null);
    }
  };

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    setSelectedEvents(prev => ({ ...prev, [eventId]: checked }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allSelected = events.reduce((acc, event) => {
        acc[event.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedEvents(allSelected);
    } else {
      setSelectedEvents({});
    }
  };

  const handleSingleImport = (event: GoogleCalendarEvent) => {
    const projectToImport = {
        ...transformEventToProject(event),
        description: '',
        paymentStatus: 'Proposed' as const,
        createdBy: { id: 'system', name: 'System', avatar: '', initials: 'S', email: '' },
    };
    onImport([projectToImport]);
    toast.success(`Event "${event.summary}" imported successfully!`);
  };

  const handleBulkImport = () => {
    const projectsToImport = events
      .filter(event => selectedEvents[event.id])
      .map(event => ({
        ...transformEventToProject(event),
        description: '',
        paymentStatus: 'Proposed' as const,
        createdBy: { id: 'system', name: 'System', avatar: '', initials: 'S', email: '' },
      }));
    
    onImport(projectsToImport);
    setSelectedEvents({});
    toast.success(`${projectsToImport.length} event(s) imported successfully!`);
  };

  const numSelected = Object.values(selectedEvents).filter(Boolean).length;
  const allSelected = events.length > 0 && numSelected === events.length;
  const someSelected = numSelected > 0 && numSelected < events.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading calendar events...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>No upcoming events found in your selected calendars for the next 30 days.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center gap-3">
                <Checkbox 
                    id="select-all"
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                    {numSelected > 0 ? `${numSelected} selected` : 'Select all'}
                </label>
            </div>
        </div>
        {events.map(event => (
          <div key={event.id} className="flex items-center justify-between rounded-lg border p-4 has-[:checked]:bg-muted">
            <div className="flex items-center gap-3 flex-1 truncate">
                <Checkbox 
                    id={event.id}
                    checked={!!selectedEvents[event.id]}
                    onCheckedChange={(checked) => handleSelectEvent(event.id, !!checked)}
                />
                <label htmlFor={event.id} className="cursor-pointer truncate">
                    <p className="font-semibold truncate">{event.summary}</p>
                    <p className="text-sm text-muted-foreground">{formatEventDate(event)}</p>
                </label>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleSingleImport(event)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Import
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                        Lihat di Google
                    </a>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEventToDelete(event)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
          </div>
        ))}
      </div>
      {numSelected > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
            <Card className="shadow-lg">
                <CardContent className="p-3 flex items-center gap-4">
                    <p className="text-sm font-medium">{numSelected} event{numSelected > 1 && 's'} selected</p>
                    <Button onClick={handleBulkImport}>Import Selected</Button>
                </CardContent>
            </Card>
        </div>
      )}
      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the event "{eventToDelete?.summary}" from your Google Calendar. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default GoogleCalendarEventsView;