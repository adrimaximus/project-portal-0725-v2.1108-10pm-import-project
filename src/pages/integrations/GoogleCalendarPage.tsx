import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface GoogleCalendar {
  id: string;
  summary: string;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleCalendarPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);

  useEffect(() => {
    const storedConnected = localStorage.getItem('googleCalendarConnected');
    const storedCalendars = localStorage.getItem('googleCalendarCalendars');
    const storedSelected = localStorage.getItem('googleCalendarSelected');

    if (storedConnected === 'true' && storedCalendars) {
      setIsConnected(true);
      setCalendars(JSON.parse(storedCalendars));
      if (storedSelected) {
        setSelectedCalendars(JSON.parse(storedSelected));
      }
    }
  }, []);

  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "YOUR_CLIENT_ID_HERE") {
    return (
      <PortalLayout>
        <div className="space-y-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/settings">Settings</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/settings/integrations">Integrations</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Google Calendar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Google Calendar Integration
                </h1>
                <p className="text-muted-foreground">
                  Connect your Google Calendar to sync your events and meetings.
                </p>
              </div>
            </div>
            
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Configuration Error</AlertTitle>
                <AlertDescription>
                    The Google Client ID is missing or incorrect. Please ensure you have:
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Correctly copied your Google Client ID into the <code>.env</code> file.</li>
                        <li>Replaced the placeholder <code>"YOUR_CLIENT_ID_HERE"</code>.</li>
                        <li>Rebuilt the application using the "Rebuild" button.</li>
                    </ol>
                </AlertDescription>
            </Alert>
        </div>
      </PortalLayout>
    );
  }

  const handleFetchCalendars = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch calendar list');
      }
      const data = await response.json();
      const fetchedCalendars = (data.items || []).filter((cal: GoogleCalendar) => cal.id);
      setCalendars(fetchedCalendars);
      setIsConnected(true);
      localStorage.setItem('googleCalendarConnected', 'true');
      localStorage.setItem('googleCalendarCalendars', JSON.stringify(fetchedCalendars));
      toast.success("Successfully fetched your calendars.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch your calendars. Please try reconnecting.");
      handleDisconnect();
    } finally {
      setIsLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      toast.success("Successfully connected to Google Calendar!");
      localStorage.setItem('googleCalendarToken', tokenResponse.access_token);
      handleFetchCalendars(tokenResponse.access_token);
    },
    onError: () => {
      toast.error("Failed to connect to Google Calendar. Please try again.");
      setIsLoading(false);
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
  });

  const handleConnect = () => {
    setIsLoading(true);
    login();
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setCalendars([]);
    setSelectedCalendars([]);
    localStorage.removeItem('googleCalendarConnected');
    localStorage.removeItem('googleCalendarCalendars');
    localStorage.removeItem('googleCalendarSelected');
    localStorage.removeItem('googleCalendarToken');
    localStorage.removeItem('googleCalendarEvents');
    toast.info("Disconnected from Google Calendar.");
  };

  const handleSaveSelection = async () => {
    const token = localStorage.getItem('googleCalendarToken');
    if (!token) {
      toast.error("Your session has expired. Please reconnect.");
      handleDisconnect();
      return;
    }

    if (selectedCalendars.length === 0) {
        localStorage.setItem('googleCalendarSelected', JSON.stringify([]));
        localStorage.removeItem('googleCalendarEvents');
        toast.info("No calendars selected. Imported events have been cleared.");
        return;
    }

    setIsLoading(true);
    toast.info("Importing events from selected calendars...");

    try {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Next 30 days
      const allEvents: any[] = [];

      for (const calendarId of selectedCalendars) {
        if (!calendarId) continue; // Skip invalid IDs

        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status === 401) {
            toast.error("Authentication expired. Please reconnect.");
            handleDisconnect();
            return;
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`Failed to fetch events for calendar ${calendarId}:`, errorData);
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
      localStorage.setItem('googleCalendarSelected', JSON.stringify(selectedCalendars));
      toast.success(`Successfully imported ${allEvents.length} events!`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to import events. Please check your calendar permissions and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings">Settings</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings/integrations">Integrations</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Google Calendar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Google Calendar Integration
            </h1>
            <p className="text-muted-foreground">
              Connect your Google Calendar to sync your events and meetings.
            </p>
          </div>
        </div>
        
        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect to Google Calendar</CardTitle>
              <CardDescription>Click the button below to connect your account.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleConnect} disabled={isLoading}>
                {isLoading ? 'Connecting...' : 'Connect Google Calendar'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Manage Calendars</CardTitle>
              <CardDescription>Select which calendars you want to sync.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && calendars.length === 0 ? (
                <p>Loading calendars...</p>
              ) : (
                <MultiSelect
                  options={calendars.map(calendar => ({
                    value: calendar.id,
                    label: calendar.summary,
                  }))}
                  onChange={setSelectedCalendars}
                  value={selectedCalendars}
                  placeholder="Select calendars to sync..."
                  className="w-full"
                />
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleDisconnect}>Disconnect</Button>
              <Button onClick={handleSaveSelection} disabled={isLoading}>Save Preferences</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default GoogleCalendarPage;