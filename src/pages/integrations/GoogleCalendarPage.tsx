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
import { AlertTriangle, Loader2 } from "lucide-react";
import GoogleConnectionStatus, { DiagnosticStep } from "@/components/settings/GoogleConnectionStatus";

interface GoogleCalendar {
  id: string;
  summary: string;
}

const GoogleCalendarPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticStep[]>([]);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Not authenticated");
    }
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const runDiagnostics = useCallback(async () => {
    const steps: DiagnosticStep[] = [
      { step: "Checking Google Client ID...", status: 'pending' },
      { step: "Verifying server connection & authentication...", status: 'pending' },
      { step: "Attempting to fetch calendars from Google...", status: 'pending' },
    ];
    setDiagnostics(steps);

    if (!googleClientId) {
      steps[0] = { ...steps[0], status: 'error', details: 'VITE_GOOGLE_CLIENT_ID is not set in environment variables.' };
      steps[1] = { ...steps[1], status: 'error', details: 'Skipped due to missing Client ID.' };
      steps[2] = { ...steps[2], status: 'error', details: 'Skipped due to missing Client ID.' };
      setDiagnostics([...steps]);
      return;
    }
    steps[0] = { ...steps[0], status: 'success' };
    setDiagnostics([...steps]);

    try {
      const headers = await getAuthHeaders();
      
      const { error: healthError } = await supabase.functions.invoke('google-auth-handler', { headers, body: { method: 'health-check' } });
      if (healthError) {
        steps[1] = { ...steps[1], status: 'error', details: `Failed to connect to the server function. ${healthError.message}` };
        steps[2] = { ...steps[2], status: 'error', details: 'Skipped due to server connection failure.' };
        setDiagnostics([...steps]);
        return;
      }
      steps[1] = { ...steps[1], status: 'success' };
      setDiagnostics([...steps]);

      const { data, error: calendarError } = await supabase.functions.invoke('google-auth-handler', { headers, body: { method: 'list-calendars' } });
      if (calendarError) {
        if (calendarError.message.includes("not connected")) {
          steps[2] = { ...steps[2], status: 'error', details: 'No active Google connection found. Please connect your account.' };
        } else {
          throw calendarError;
        }
      } else {
        steps[2] = { ...steps[2], status: 'success', details: `Successfully fetched ${data.length} calendars.` };
      }
    } catch (e: any) {
      const errorMessage = e.message || 'An unknown error occurred.';
      if (steps[1].status === 'pending') {
        steps[1] = { ...steps[1], status: 'error', details: errorMessage };
        steps[2] = { ...steps[2], status: 'error', details: 'Skipped due to authentication/connection failure.' };
      } else {
        steps[2] = { ...steps[2], status: 'error', details: errorMessage };
      }
    }
    setDiagnostics([...steps]);
  }, [googleClientId]);

  const initializePage = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const { data, error } = await supabase.functions.invoke('google-auth-handler', {
        headers,
        body: { method: 'list-calendars' }
      });

      if (error) {
        if (error.message.includes("not connected")) {
          setIsConnected(false);
          setCalendars([]);
        } else {
          throw error;
        }
      } else {
        setIsConnected(true);
        const fetchedCalendars = (data || []).filter((cal: GoogleCalendar) => cal.id);
        setCalendars(fetchedCalendars);
        const storedSelections = localStorage.getItem('googleCalendarSelected');
        if (storedSelections) {
          setSelectedCalendars(JSON.parse(storedSelections));
        }
      }
    } catch (error: any) {
      toast.error("Failed to check Google connection.", { description: error.message });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
      runDiagnostics();
    }
  }, [runDiagnostics]);

  useEffect(() => {
    initializePage();
  }, [initializePage]);

  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      try {
        const headers = await getAuthHeaders();
        const { error } = await supabase.functions.invoke('google-auth-handler', {
          headers,
          body: { method: 'exchange-code', code: codeResponse.code }
        });
        if (error) throw error;
        toast.success("Successfully connected to Google Calendar!");
        await initializePage();
      } catch (error: any) {
        toast.error("Failed to connect Google Account.", { description: error.message });
        setIsLoading(false);
      }
    },
    onError: () => {
      toast.error("Failed to connect to Google Calendar. Please try again.");
      setIsLoading(false);
    },
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
  });

  const handleDisconnect = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const { error } = await supabase.functions.invoke('google-auth-handler', {
        headers,
        body: { method: 'disconnect' }
      });
      if (error) throw error;
      setIsConnected(false);
      setCalendars([]);
      setSelectedCalendars([]);
      localStorage.removeItem('googleCalendarSelected');
      localStorage.removeItem('googleCalendarSelectedObjects');
      toast.info("Disconnected from Google Calendar.");
    } catch (error: any) {
      toast.error("Failed to disconnect.", { description: error.message });
    } finally {
      setIsLoading(false);
      runDiagnostics();
    }
  }, [runDiagnostics]);

  const handleConnect = () => {
    setIsLoading(true);
    login();
  };

  const handleSaveSelection = async () => {
    setIsLoading(true);
    try {
      const selectionsToSave = calendars.filter(c => selectedCalendars.includes(c.id));
      localStorage.setItem('googleCalendarSelected', JSON.stringify(selectionsToSave.map(s => s.id)));
      localStorage.setItem('googleCalendarSelectedObjects', JSON.stringify(selectionsToSave));
      toast.success("Calendar preferences for manual import have been saved.");
    } catch (error) {
      toast.error("Could not save calendar preferences to local storage.");
    } finally {
      setIsLoading(false);
    }
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
          <p className="text-muted-foreground">Connect a Google account for the workspace to manually import events as projects.</p>
        </div>
        
        {!isConnected ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect to Google Calendar</CardTitle>
              <CardDescription>Allow access to a Google Calendar to enable manual event imports for the entire workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleConnect} disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</> : 'Connect Google Calendar'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Manage Workspace Calendars</CardTitle>
              <CardDescription>Select which calendars to make available for manual import by all users.</CardDescription>
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
                  placeholder="Select calendars to make available..."
                  className="w-full"
                />
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="destructive" onClick={handleDisconnect} disabled={isLoading}>Disconnect</Button>
              <Button onClick={handleSaveSelection} disabled={isLoading}>Save Preferences</Button>
            </CardFooter>
          </Card>
        )}

        <GoogleConnectionStatus steps={diagnostics} onRun={runDiagnostics} />
      </div>
    </PortalLayout>
  );
};

export default GoogleCalendarPage;