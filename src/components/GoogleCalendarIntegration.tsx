import { useState, useEffect } from 'react';
import { gapi } from 'gapi-script';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Calendar {
  id: string;
  summary: string;
}

const GoogleCalendarIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const SCOPES = "https://www.googleapis.com/auth/calendar";

  useEffect(() => {
    const initClient = () => {
      gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES,
      }).then(() => {
        const gcalConnected = localStorage.getItem('gcal_connected') === 'true';
        if (gcalConnected) {
          setIsConnected(true);
          const accessToken = localStorage.getItem('gcal_access_token');
          if (accessToken) {
            gapi.client.setToken({ access_token: accessToken });
            fetchCalendars();
          }
          const storedIds = JSON.parse(localStorage.getItem('gcal_calendar_ids') || '[]');
          const selected: Record<string, boolean> = {};
          storedIds.forEach((id: string) => {
            selected[id] = true;
          });
          setSelectedCalendars(selected);
        }
        setIsLoading(false);
      }).catch(error => {
        console.error("Error initializing gapi client", error);
        toast.error("Could not initialize Google API client.");
        setIsLoading(false);
      });
    };
    gapi.load('client:auth2', initClient);
  }, [CLIENT_ID]);

  const handleAuthClick = () => {
    setIsAuthLoading(true);
    gapi.auth2.getAuthInstance().signIn().then((googleUser) => {
      const accessToken = googleUser.getAuthResponse().access_token;
      localStorage.setItem('gcal_connected', 'true');
      localStorage.setItem('gcal_access_token', accessToken);
      gapi.client.setToken({ access_token: accessToken });
      setIsConnected(true);
      toast.success("Successfully connected to Google Calendar!");
      fetchCalendars();
      window.dispatchEvent(new Event("storage"));
    }).catch(error => {
      console.error("Error signing in", error);
      toast.error("Failed to connect to Google Calendar.");
    }).finally(() => {
      setIsAuthLoading(false);
    });
  };

  const handleSignoutClick = () => {
    try {
      const auth2 = gapi.auth2.getAuthInstance();
      if (auth2) {
        auth2.signOut().then(() => {
          auth2.disconnect();
        });
      }
    } catch (e) {
      console.error("Error signing out", e);
    } finally {
      localStorage.removeItem('gcal_connected');
      localStorage.removeItem('gcal_access_token');
      localStorage.removeItem('gcal_calendar_ids');
      setIsConnected(false);
      setCalendars([]);
      setSelectedCalendars({});
      toast.info("Disconnected from Google Calendar.");
      window.dispatchEvent(new Event("storage"));
    }
  };

  const fetchCalendars = async () => {
    try {
      const response = await gapi.client.calendar.calendarList.list();
      if (response.result.items) {
        const validCalendars = response.result.items
          .filter(cal => cal.id && cal.summary) // Ensure id and summary exist
          .map(cal => ({
            id: cal.id!, // We know id is not null here
            summary: cal.summary!, // We know summary is not null here
          }));
        setCalendars(validCalendars);
      }
    } catch (error) {
      console.error("Error fetching calendars", error);
      toast.error("Failed to fetch your calendars.");
    }
  };

  const handleCalendarSelection = (calendarId: string, checked: boolean) => {
    const newSelected = { ...selectedCalendars, [calendarId]: checked };
    setSelectedCalendars(newSelected);
    const selectedIds = Object.keys(newSelected).filter(id => newSelected[id]);
    localStorage.setItem('gcal_calendar_ids', JSON.stringify(selectedIds));
    toast.success("Calendar selection saved.");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Calendar Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Calendar Integration</CardTitle>
        <CardDescription>
          {isConnected
            ? "Manage your connected calendars. Synced events will appear in your projects view."
            : "Connect your Google Calendar to see your events and import them as projects."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Button onClick={handleAuthClick} disabled={isAuthLoading}>
            {isAuthLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect to Google Calendar
          </Button>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Select calendars to sync:</Label>
              {calendars.length > 0 ? (
                <div className="space-y-2 rounded-md border p-4 max-h-60 overflow-y-auto">
                  {calendars.map(calendar => (
                    <div key={calendar.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={calendar.id}
                        checked={!!selectedCalendars[calendar.id]}
                        onCheckedChange={(checked) => handleCalendarSelection(calendar.id, !!checked)}
                      />
                      <Label htmlFor={calendar.id} className="font-normal">{calendar.summary}</Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Fetching calendars...</p>
              )}
            </div>
            <Button variant="destructive" onClick={handleSignoutClick}>
              Disconnect from Google Calendar
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarIntegration;