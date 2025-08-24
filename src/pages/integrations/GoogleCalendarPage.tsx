import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface GoogleCalendar {
  id: string;
  summary: string;
}

const GoogleCalendarPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const fetchUserSelections = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('google-auth-handler', { body: { method: 'get-selections' } });
    if (error) {
      toast.error("Failed to fetch your calendar selections.");
    } else {
      setSelectedCalendars(data.selections || []);
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('google-auth-handler', { body: { method: 'disconnect' } });
      if (error) throw error;
      setIsConnected(false);
      setCalendars([]);
      setSelectedCalendars([]);
      toast.info("Disconnected from Google Calendar.");
    } catch (error: any) {
      toast.error("Failed to disconnect.", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFetchCalendars = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-auth-handler', {
        body: { method: 'list-calendars' }
      });
      if (error) throw error;
      
      const fetchedCalendars = (data || []).filter((cal: GoogleCalendar) => cal.id);
      setCalendars(fetchedCalendars);
      toast.success("Successfully fetched your calendars.");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to fetch your calendars.", { description: error.message });
      await handleDisconnect();
    } finally {
      setIsLoading(false);
    }
  }, [handleDisconnect]);

  const checkConnectionStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error: healthError } = await supabase.functions.invoke('google-auth-handler', { body: { method: 'health-check' } });
      if (healthError) throw new Error(`Edge Function not responding: ${healthError.message}`);

      const { data, error } = await supabase.functions.invoke('google-auth-handler', { body: { method: 'get-status' } });
      if (error) throw error;
      setIsConnected(data.connected);
      if (data.connected) {
        await fetchUserSelections();
        await handleFetchCalendars();
      }
    } catch (error: any) {
      console.error("Failed to check connection status:", error.message);
      toast.error("Connection Check Failed", { description: error.message });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserSelections, handleFetchCalendars]);

  useEffect(() => {
    checkConnectionStatus();
  }, [checkConnectionStatus]);

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      const { error } = await supabase.functions.invoke('google-auth-handler', {
        body: { method: 'exchange-code', code: codeResponse.code }
      });
      if (error) {
        toast.error("Failed to connect Google Account.", { description: error.message });
      } else {
        toast.success("Successfully connected to Google Calendar!");
        setIsConnected(true);
        await fetchUserSelections();
        await handleFetchCalendars();
      }
      setIsLoading(false);
    },
    onError: () => {
      toast.error("Failed to connect to Google Calendar. Please try again.");
      setIsLoading(false);
    },
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
  });

  const handleConnect = () => {
    setIsLoading(true);
    login();
  };

  const handleSaveSelection = async () => {
    setIsLoading(true);
    const selectionsToSave = calendars.filter(c => selectedCalendars.includes(c.id));
    const { error } = await supabase.functions.invoke('google-auth-handler', {
      body: { method: 'save-selections', selections: selectionsToSave.map(s => ({ id: s.id, summary: s.summary })) }
    });
    if (error) {
      toast.error("Failed to save preferences.", { description: error.message });
    } else {
      toast.success("Your calendar preferences have been saved.");
    }
    setIsLoading(false);
  };

  if (!googleClientId) {
    return (
      <PortalLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            The Google Client ID is missing in the application's environment variables. Please add <strong>VITE_GOOGLE_CLIENT_ID</strong> to your .env file and rebuild the application.
          </AlertDescription>
        </Alert>
      </PortalLayout>
    )
  }

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
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Google Calendar Integration</h1>
          <p className="text-muted-foreground">Connect your Google Calendar to automatically import events as projects.</p>
        </div>
        
        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect to Google Calendar</CardTitle>
              <CardDescription>Allow access to your Google Calendar to enable automatic daily imports.</CardDescription>
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
              <CardDescription>Select which calendars you want to sync automatically every day.</CardDescription>
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
              <Button variant="outline" onClick={handleDisconnect} disabled={isLoading}>Disconnect</Button>
              <Button onClick={handleSaveSelection} disabled={isLoading}>Save Preferences</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
};

export default GoogleCalendarPage;