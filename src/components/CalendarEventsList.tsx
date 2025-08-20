import { Calendar, Clock, Import } from 'lucide-react';
import { Button } from './ui/button';

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
  onImportEvent?: (event: CalendarEvent) => void;
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
        return (
            <li key={event.id} className="flex items-center space-x-3 sm:space-x-4 p-3 rounded-lg border bg-background hover:bg-muted transition-colors">
              <div className="flex-shrink-0 pt-1 self-start">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                  <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline break-words">
                  {event.summary || "No Title"}
                  </a>
                  <div className="text-sm text-muted-foreground flex items-center space-x-2 mt-1">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{formatDate(event.start.dateTime || event.start.date, isAllDay)}</span>
                  </div>
              </div>
              {onImportEvent && (
                <Button variant="ghost" size="sm" onClick={() => onImportEvent(event)} className="shrink-0 px-2 sm:px-3">
                  <Import className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Import</span>
                </Button>
              )}
            </li>
        )
      })}
    </ul>
  );
};

export default CalendarEventsList;