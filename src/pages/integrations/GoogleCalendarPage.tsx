import { useState, useEffect } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { GoogleOAuthProvider, useGoogleLogin, TokenResponse } from '@react-oauth/google';
import { gapi } from 'gapi-script';
import { GoogleCalendarListEntry } from '@/types';
import { MultiSelect } from '@/components/ui/multi-select';
import { Loader2 } from 'lucide-react';
import { GOOGLE_CLIENT_ID } from '@/config';

const GoogleLoginButton = ({ onConnectSuccess, onConnectError }: { onConnectSuccess: (tokenResponse: Omit<TokenResponse, "error" | "error_description" | "error_uri">) => void, onConnectError: () => void }) => {
  const login = useGoogleLogin({
    onSuccess: onConnectSuccess,
    onError: onConnectError,
    scope: 'https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.readonly',
  });

  return <Button onClick={() => login()}>Connect with Google</Button>;
};

const GoogleCalendarPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendarListEntry[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);

  const fetchCalendars = async () => {
    const accessToken = localStorage.getItem('gcal_access_token');
    if (!accessToken) return;

    setIsLoadingCalendars(true);
    try {
      await new Promise<void>((resolve) => gapi.load('client', resolve));
      await gapi.client.init({
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
      });
      gapi.client.setToken({ access_token: accessToken });

      const response = await gapi.client.calendar.calendarList.list();
      const validCalendars = response.result.items
        .filter(cal => cal.id && cal.summary)
        .map(cal => ({
          id: cal.id!,
          summary: cal.summary!,
          primary: cal.primary ?? undefined,
        }));
      
      setCalendars(validCalendars);
      
      if (!localStorage.getItem("gcal_calendar_ids")) {
        const primaryCalendar = validCalendars.find((cal) => cal.primary);
        if (primaryCalendar) {
          setSelectedCalendarIds([primaryCalendar.id]);
        }
      }

    } catch (error) {
      toast.error("Failed to fetch calendar list.");
      console.error(error);
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  useEffect(() => {
    const storedStatus = localStorage.getItem("gcal_connected");
    const storedCalendarIds = localStorage.getItem("gcal_calendar_ids");

    if (storedStatus === "true") {
      setIsConnected(true);
      if (storedCalendarIds) {
        try {
          const ids = JSON.parse(storedCalendarIds);
          if (Array.isArray(ids)) {
            setSelectedCalendarIds(ids);
          }
        } catch (e) {
          console.error("Failed to parse stored calendar IDs", e);
        }
      }
      fetchCalendars();
    }
  }, []);

  const handleConnectSuccess = (tokenResponse: Omit<TokenResponse, "error" | "error_description" | "error_uri">) => {
    localStorage.setItem("gcal_connected", "true");
    localStorage.setItem("gcal_clientId", GOOGLE_CLIENT_ID);
    localStorage.setItem("gcal_access_token", tokenResponse.access_token);
    setIsConnected(true);
    toast.success("Successfully connected to Google Calendar!");
    fetchCalendars();
  };

  const handleConnectError = () => {
    toast.error("Google Calendar connection failed. Please try again.");
  };

  const handleDisconnect = () => {
    localStorage.removeItem("gcal_connected");
    localStorage.removeItem("gcal_clientId");
    localStorage.removeItem("gcal_access_token");
    localStorage.removeItem("gcal_calendar_ids");
    setIsConnected(false);
    setCalendars([]);
    setSelectedCalendarIds([]);
    toast.info("Disconnected from Google Calendar.");
  };

  const handleSaveSelection = () => {
    localStorage.setItem('gcal_calendar_ids', JSON.stringify(selectedCalendarIds));
    toast.success('Calendar selection saved!');
  };

  const calendarOptions = calendars.map(c => ({ value: c.id, label: c.summary }));

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/settings">Settings</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/settings/integrations">Integrations</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Google Calendar</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Google Calendar Integration</h1>
            <p className="text-muted-foreground">Sync your events and meetings from Google Calendar.</p>
          </div>
          {isConnected && <Badge variant="secondary">Connected</Badge>}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Connect to Google Calendar</CardTitle>
            <CardDescription>
              Connect your Google account to allow this application to read your calendar events. Your credentials are handled securely by Google and are not stored on our servers.
            </CardDescription>
          </CardHeader>
          {isConnected && (
            <CardContent className="space-y-4">
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="calendar-select">Select Calendars to Sync</Label>
                {isLoadingCalendars ? (
                  <div className="flex items-center gap-2 text-muted-foreground h-10">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading your calendars...</span>
                  </div>
                ) : calendars.length > 0 ? (
                  <>
                    <MultiSelect
                      options={calendarOptions}
                      selectedValues={selectedCalendarIds}
                      onChange={setSelectedCalendarIds}
                      placeholder="Select calendars to sync..."
                    />
                    {selectedCalendarIds.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <p>
                          Status: <strong>Synced</strong> ({selectedCalendarIds.length} calendar{selectedCalendarIds.length > 1 ? 's' : ''})
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                    <p className="text-sm text-muted-foreground h-10 flex items-center">Could not find any calendars. Please ensure you have granted calendar permissions.</p>
                )}
              </div>
            </CardContent>
          )}
          <CardFooter className="flex justify-end gap-2">
            {isConnected ? (
                <>
                    <Button variant="outline" onClick={handleDisconnect}>Disconnect</Button>
                    <Button onClick={handleSaveSelection} disabled={isLoadingCalendars}>Save Selection</Button>
                </>
            ) : (
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <GoogleLoginButton onConnectSuccess={handleConnectSuccess} onConnectError={handleConnectError} />
              </GoogleOAuthProvider>
            )}
          </CardFooter>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default GoogleCalendarPage;