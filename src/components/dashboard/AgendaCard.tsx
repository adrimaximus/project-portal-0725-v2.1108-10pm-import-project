import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2, AlertTriangle, PlusCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from 'date-fns';
import { Link } from "react-router-dom";

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink: string;
}

const fetchCalendarEvents = async () => {
  const { data, error } = await supabase.functions.invoke('get-google-calendar-events');
  if (error) throw error;
  return data.events as CalendarEvent[];
};

const AgendaCard = () => {
  const { user } = useAuth();
  const isGoogleCalendarConnected = !!user?.google_calendar_settings?.token;

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['googleCalendarEvents', user?.id],
    queryFn: fetchCalendarEvents,
    enabled: isGoogleCalendarConnected,
  });

  const formatEventTime = (start: { dateTime?: string; date?: string }, end: { dateTime?: string; date?: string }) => {
    if (start.dateTime) {
      const startTime = format(new Date(start.dateTime), 'p');
      const endTime = end.dateTime ? format(new Date(end.dateTime), 'p') : '';
      return `${startTime}${endTime ? ` - ${endTime}` : ''}`;
    }
    return 'All day';
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-destructive space-y-2">
          <AlertTriangle className="mx-auto h-8 w-8" />
          <p className="text-sm font-semibold">Could not load agenda</p>
          <p className="text-xs">{error.message}</p>
        </div>
      );
    }

    if (events && events.length > 0) {
      return (
        <ul className="space-y-3">
          {events.map(event => (
            <li key={event.id} className="flex items-start gap-3">
              <div className="text-xs font-semibold text-muted-foreground w-20 text-right pt-1">
                {formatEventTime(event.start, event.end)}
              </div>
              <div className="flex-1 border-l-2 pl-3">
                <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:underline">
                  {event.summary}
                </a>
              </div>
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div className="text-center text-muted-foreground space-y-2">
        <Calendar className="mx-auto h-8 w-8" />
        <p className="text-sm font-semibold">No events scheduled for today.</p>
        <p className="text-xs">Your agenda is clear!</p>
      </div>
    );
  };

  if (!isGoogleCalendarConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Agenda</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p className="text-sm mb-4">Connect your Google Calendar to see your daily agenda here.</p>
          <Button asChild>
            <Link to="/settings/integrations/google-calendar">
              <PlusCircle className="mr-2 h-4 w-4" />
              Connect Calendar
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Agenda</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default AgendaCard;