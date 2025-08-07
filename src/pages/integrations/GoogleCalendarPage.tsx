import { useState, useEffect } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { GoogleOAuthProvider, useGoogleLogin, TokenResponse } from '@react-oauth/google';
import { gapi } from 'gapi-script';
import { GoogleCalendarListEntry } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const GoogleLoginButton = ({ onConnectSuccess, onConnectError }: { onConnectSuccess: (tokenResponse: Omit<TokenResponse, "error" | "error_description" | "error_uri">) => void, onConnectError: () => void }) => {
  const login = useGoogleLogin({
    onSuccess: onConnectSuccess,
    onError: onConnectError,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
  });

  return <Button onClick={() => login()}>Connect with Google</Button>;
};

const GoogleCalendarPage = () => {
  const [clientId, setClientId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendarListEntry[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState('');
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);

  // Load connection status from local storage on component mount
  useEffect(() => {
    const storedStatus = localStorage.getItem("gcal_connected");
    const storedClientId = localStorage.getItem("gcal_clientId");
    const storedCalendarId = localStorage.getItem("gcal_calendar_id");

    if (storedStatus === "true" && storedClientId) {
      setIsConnected(true);
      setClientId(storedClientId);
      if (storedCalendarId) {
        setSelectedCalendarId(storedCalendarId);
      }
      // If connected, fetch the list of available calendars
      fetchCalendars(storedClientId);
    }
  }, []);

  const fetchCalendars = async (currentClientId: string) => {
    const accessToken = localStorage.getItem('gcal_access_token');
    if (!accessToken) {
      toast.error("Authentication token not found. Please try reconnecting.");
      return;
    }

    setIsLoadingCalendars(true);
    try {
      // Load the Google API client
      await new Promise<void>((resolve) => gapi.load('client', resolve));
      await gapi.client.init({
        clientId: currentClientId,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
      });
      gapi.client.setToken({ access_token: accessToken });

      // Fetch the list of calendars
      const response = await gapi.client.calendar.calendarList.list();
      
      // Filter out any calendars that don't have an ID or summary
      const validCalendars = response.result.items
        .filter(cal => cal.id && cal.summary)
        .map(cal => ({
          id: cal.id!,
          summary: cal.summary!,
          primary: cal.primary ?? undefined,
        }));
      
      setCalendars(validCalendars);
      
      // If no calendar is selected yet, default to the primary calendar
      const primaryCalendar = validCalendars.find((cal) => cal.primary);
      if (primaryCalendar && !localStorage.getItem("gcal_calendar_id")) {
        setSelectedCalendarId(primaryCalendar.id);
      }

    } catch (error) {
      toast.error("Failed to fetch your list of calendars. Please check console for details.");
      console.error("Error fetching calendar list:", error);
    } finally {
      setIsLoadingCalendars(false);
    }
  };

  const handleConnectSuccess = (tokenResponse: Omit<TokenResponse, "error" | "error_description" | "error_uri">) => {
    localStorage.setItem("gcal_connected", "true");
    localStorage.setItem("gcal_clientId", clientId);
    localStorage.setItem("gcal_access_token", tokenResponse.access_token);
    setIsConnected(true);
    toast.success("Successfully connected to Google Calendar!");
    // After connecting, fetch the list of calendars
    fetchCalendars(clientId);
  };

  const handleConnectError = () => {
    toast.error("Google Calendar connection failed. Please check your Client ID and try again.");
  };

  const handleDisconnect = () => {
    // Clear all related local storage items
    localStorage.removeItem("gcal_connected");
    localStorage.removeItem("gcal_clientId");
    localStorage.removeItem("gcal_access_token");
    localStorage.removeItem("gcal_calendar_id");
    
    // Reset component state
    setIsConnected(false);
    setClientId('');
    setCalendars([]);
    setSelectedCalendarId('');
    toast.info("Disconnected from Google Calendar.");
  };

  const handleSaveSelection = () => {
    if (!selectedCalendarId) {
        toast.warning("Please select a calendar before saving.");
        return;
    }
    localStorage.setItem('gcal_calendar_id', selectedCalendarId);
    toast.success('Calendar selection saved!');
  };

  const selectedCalendarName = calendars.find(c => c.id === selectedCalendarId)?.summary;

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
              Enter your Google Cloud Client ID to activate the integration. This will allow the application to read your calendar events.
              Your credentials are stored locally in your browser and never sent to our servers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="client-id">Google Client ID</Label>
                <Input 
                  id="client-id" 
                  placeholder={isConnected ? "••••••••••••••••••••••••.apps.googleusercontent.com" : "Enter your Client ID"}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={isConnected}
                />
            </div>

            {/* This section will appear only after a successful connection */}
            {isConnected && (
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="calendar-select">Select Calendar to Sync</Label>
                {isLoadingCalendars ? (
                  <div className="flex items-center gap-2 text-muted-foreground h-10">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading your calendars...</span>
                  </div>
                ) : calendars.length > 0 ? (
                  <>
                    <Select value={selectedCalendarId} onValueChange={setSelectedCalendarId}>
                      <SelectTrigger id="calendar-select">
                        <SelectValue placeholder="Select a calendar to sync" />
                      </SelectTrigger>
                      <SelectContent>
                        {calendars.map(cal => (
                          <SelectItem key={cal.id} value={cal.id}>{cal.summary}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCalendarName && <p className="text-xs text-muted-foreground">Currently syncing: <strong>{selectedCalendarName}</strong></p>}
                  </>
                ) : (
                    <p className="text-sm text-muted-foreground h-10 flex items-center">Could not find any calendars. Please ensure you have granted calendar permissions.</p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            {isConnected ? (
                <>
                    <Button variant="outline" onClick={handleDisconnect}>Disconnect</Button>
                    <Button onClick={handleSaveSelection} disabled={!selectedCalendarId || isLoadingCalendars}>Save Selection</Button>
                </>
            ) : (
              clientId.trim() ? (
                <GoogleOAuthProvider clientId={clientId} key={clientId}>
                  <GoogleLoginButton onConnectSuccess={handleConnectSuccess} onConnectError={handleConnectError} />
                </GoogleOAuthProvider>
              ) : (
                <Button disabled>Connect with Google</Button>
              )
            )}
          </CardFooter>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default GoogleCalendarPage;