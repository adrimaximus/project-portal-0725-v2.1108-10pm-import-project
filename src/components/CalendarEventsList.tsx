import { Calendar, Clock, Import, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink: string;
}

interface CalendarEventsListProps {
  events: CalendarEvent[];
  onImportEvent?: (event: CalendarEvent) => Promise<void>;
}

const formatDate = (dateStr: string | undefined, isAllDay: boolean) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isAllDay) {
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC',
        });
    }
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const CalendarEventsList = ({ events, onImportEvent }: CalendarEventsListProps) => {
  const [importingId, setImportingId] = useState<string | null>(null);

  const handleImportClick = async (event: CalendarEvent) => {
    if (!onImportEvent) return;

    setImportingId(event.id);
    try {
      await onImportEvent(event);
      // Toast notifikasi ditangani oleh komponen induk
    } catch (error) {
      // Toast notifikasi error ditangani oleh komponen induk
      console.error("Import failed:", error);
    } finally {
      setImportingId(null);
    }
  };

  if (!events || events.length === 0) {
    return (
        <div className="text-center text-muted-foreground py-12">
            <p className="text-lg font-medium">No calendar events to import.</p>
            <p className="text-sm">Connect your Google Calendar in settings to see events here.</p>
        </div>
    );
  }

  return (
    <ul className="space-y-3">
      {events.map(event => {
        const isAllDay = !event.start.dateTime;
        const isImporting = importingId === event.id;
        return (
            <li key={event.id} className="flex items-center space-x-4 p-3 rounded-lg border bg-background hover:bg-muted transition-colors">
              <div className="flex-shrink-0 pt-1 self-start">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                  <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                  {event.summary || "No Title"}
                  </a>
                  <div className="text-sm text-muted-foreground flex items-center space-x-2 mt-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(event.start.dateTime || event.start.date, isAllDay)}</span>
                  </div>
              </div>
              {onImportEvent && (
                <Button variant="ghost" size="sm" onClick={() => handleImportClick(event)} disabled={isImporting}>
                  {isImporting ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Import className="mr-2 h-4 w-4" />
                  )}
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              )}
            </li>
        )
      })}
    </ul>
  );
};

export default CalendarEventsList;