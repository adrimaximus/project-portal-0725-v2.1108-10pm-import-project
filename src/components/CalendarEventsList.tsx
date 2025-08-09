import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mendefinisikan tipe yang disederhanakan untuk acara Google Kalender
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
}

const formatDate = (dateStr: string | undefined, isAllDay: boolean) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isAllDay) {
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC', // Treat as UTC to avoid timezone shift for all-day events
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

const CalendarEventsList = ({ events }: CalendarEventsListProps) => {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Imported Calendar Events</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {events.map(event => {
            const isAllDay = !event.start.dateTime;
            return (
                <li key={event.id} className="flex items-start space-x-4 p-2 rounded-md hover:bg-muted">
                <div className="flex-shrink-0 pt-1">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                    <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {event.summary}
                    </a>
                    <div className="text-sm text-muted-foreground flex items-center space-x-2 mt-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(event.start.dateTime || event.start.date, isAllDay)}</span>
                    </div>
                </div>
                </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default CalendarEventsList;