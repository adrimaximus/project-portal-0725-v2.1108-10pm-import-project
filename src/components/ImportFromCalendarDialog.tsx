import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getGoogleCalendarEvents } from '@/lib/gcal';
import { GoogleCalendarEvent } from '@/types';
import { Project } from '@/data/projects';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal, Calendar as CalendarIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from './ui/skeleton';

interface ImportFromCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (projects: Project[]) => void;
}

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

const formatEventDate = (event: GoogleCalendarEvent) => {
    const start = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date!);
    const end = event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date!);
    
    if (event.start.date) {
        const adjustedEnd = new Date(end.getTime() - 1);
        if (start.toDateString() === adjustedEnd.toDateString()) {
            return format(start, 'MMM d, yyyy');
        }
        return `${format(start, 'MMM d')} - ${format(adjustedEnd, 'MMM d, yyyy')}`;
    }

    if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
        return `${format(start, 'MMM d, yyyy')} · ${format(start, 'p')} - ${format(end, 'p')}`;
    }
    
    return `${format(start, 'MMM d, p')} - ${format(end, 'MMM d, p')}`;
};

const ImportFromCalendarDialog = ({ open, onOpenChange, onImport }: ImportFromCalendarDialogProps) => {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      setSelectedEvents({});
      
      const fetchEvents = async () => {
        const token = localStorage.getItem('gcal_access_token');
        if (!token) {
          setError('Not connected to Google Calendar.');
          setLoading(false);
          return;
        }

        try {
          const fetchedEvents = await getGoogleCalendarEvents(token);
          setEvents(fetchedEvents);
        } catch (e) {
          setError('Failed to fetch events. Please try reconnecting in settings.');
          console.error(e);
        } finally {
          setLoading(false);
        }
      };

      fetchEvents();
    }
  }, [open]);

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    setSelectedEvents(prev => ({ ...prev, [eventId]: checked }));
  };

  const handleImport = () => {
    const projectsToImport = events
      .filter(event => selectedEvents[event.id])
      .map(event => ({
        ...transformEventToProject(event),
        description: '',
        paymentStatus: 'Proposed' as const,
        createdBy: { id: 'system', name: 'System', avatar: '', initials: 'S', email: '' },
      }));
    
    onImport(projectsToImport);
    onOpenChange(false);
  };

  const numSelected = Object.values(selectedEvents).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Import from Google Calendar</DialogTitle>
          <DialogDescription>
            Select events to import as new projects. Imported projects will be given a 'Requested' status.
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[50vh] -mx-6 px-6">
          {loading ? (
            <div className="space-y-3 pr-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 border p-3 rounded-md">
                  <Skeleton className="h-5 w-5" />
                  <div className="space-y-2 flex-grow">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : events.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No upcoming events</h3>
                <p className="mt-1 text-sm text-muted-foreground">Your Google Calendar has no upcoming events to import.</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                {events.map(event => (
                  <div key={event.id} className="flex items-start space-x-3 border p-3 rounded-md has-[:checked]:bg-muted">
                    <Checkbox 
                      id={event.id}
                      checked={!!selectedEvents[event.id]}
                      onCheckedChange={(checked) => handleSelectEvent(event.id, !!checked)}
                      className="mt-1"
                    />
                    <label htmlFor={event.id} className="flex-grow cursor-pointer">
                      <p className="font-medium">{event.summary}</p>
                      <p className="text-sm text-muted-foreground">{formatEventDate(event)}</p>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={numSelected === 0 || loading}>
            Import {numSelected > 0 ? `${numSelected} ` : ''}Event{numSelected !== 1 && 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportFromCalendarDialog;