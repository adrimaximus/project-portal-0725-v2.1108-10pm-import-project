import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useGoogleLogin, TokenResponse } from "@react-oauth/google";
import { toast } from "sonner";

interface GoogleCalendar {
  id: string;
  summary: string;
}

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

  const handleFetchCalendars = async (tokenResponse: Omit<TokenResponse, "error" | "error_description" | "error_uri">) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${tokenResponse.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch calendar list');
      }
      const data = await response.json();
      const fetchedCalendars = data.items || [];
      setCalendars(fetchedCalendars);
      setIsConnected(true);
      localStorage.setItem('googleCalendarConnected', 'true');
      localStorage.setItem('googleCalendarCalendars', JSON.stringify(fetchedCalendars));
      toast.success("Successfully fetched your calendars.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch your calendars. Please try reconnecting.");
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      toast.success("Successfully connected to Google Calendar!");
      handleFetchCalendars(tokenResponse);
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
    toast.info("Disconnected from Google Calendar.");
  };

  const handleSaveSelection = () => {
    console.log("Selected calendars to sync:", selectedCalendars);
    localStorage.setItem('googleCalendarSelected', JSON.stringify(selectedCalendars));
    toast.success("Your calendar preferences have been saved!");
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
              {isLoading ? (
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
              <Button onClick={handleSaveSelection} disabled={isLoading || selectedCalendars.length === 0}>Save Preferences</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default GoogleCalendarPage;