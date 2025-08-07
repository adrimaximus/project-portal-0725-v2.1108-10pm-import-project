import { useState, useEffect } from 'react';
import { gapi } from 'gapi-script';
import { toast } from 'sonner';
import { GoogleCalendarEvent } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Clock, Users, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface GoogleCalendarEventsViewProps {
  refreshKey: number;
}

const GoogleCalendarEventsView = ({ refreshKey }: GoogleCalendarEventsViewProps) => {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);

      const gcalConnected = localStorage.getItem('gcal_connected') === 'true';
      const accessToken = localStorage.getItem('gcal_access_token');
      const clientId = localStorage.getItem('gcal_clientId');
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

      if (!gcalConnected || !accessToken || !clientId) {
        setError("Google Calendar is not connected. Please connect it in the settings.");
        setIsLoading(false);
        return;
      }
      
      if (calendarIds.length === 0) {
        setError("No calendars selected to sync. Please select calendars in the settings.");
        setIsLoading(false);
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
        timeMax.setDate(timeMax.getDate() + 30); // Fetch events for the next 30 days

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
        const allEvents = responses.flatMap(response => response.result.items);

        const formattedEvents: GoogleCalendarEvent[] = allEvents
          .map((item: any) => ({
            id: item.id,
            summary: item.summary,
            description: item.description,
            start: { dateTime: item.start.dateTime || item.start.date, timeZone: item.start.timeZone || 'UTC' },
            end: { dateTime: item.end.dateTime || item.end.date, timeZone: item.end.timeZone || 'UTC' },
            creator: { email: item.creator?.email || 'Unknown' },
            attendees: item.attendees,
            isGoogleEvent: true as const,
            htmlLink: item.htmlLink,
          }))
          .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
        
        setEvents(formattedEvents);
      } catch (err: any) {
        console.error("Error fetching Google Calendar events:", err);
        if (err.result?.error?.code === 401 || err.result?.error?.code === 403) {
          setError("Google session expired. Please reconnect in settings.");
          toast.error("Google session expired. Please reconnect in settings.");
          localStorage.removeItem('gcal_connected');
          localStorage.removeItem('gcal_access_token');
        } else {
          setError("Failed to fetch calendar events.");
          toast.error("Failed to fetch calendar events.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [refreshKey]);

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
    <div className="space-y-4">
      {events.map(event => (
        <Card key={event.id}>
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardTitle className="text-lg">{event.summary}</CardTitle>
              <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{format(parseISO(event.start.dateTime), 'eeee, d MMMM yyyy', { locale: id })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(parseISO(event.start.dateTime), 'HH:mm')} - {format(parseISO(event.end.dateTime), 'HH:mm')}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" asChild>
              <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {event.attendees.map(attendee => (
                    <span key={attendee.email} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      {attendee.email}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GoogleCalendarEventsView;