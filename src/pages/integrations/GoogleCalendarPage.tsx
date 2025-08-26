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
import { AlertTriangle, Loader2, RefreshCw, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import GoogleConnectionStatus, { DiagnosticStep } from "@/components/settings/GoogleConnectionStatus";
import { format, formatDistanceToNow } from "date-fns";
import { id } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface GoogleCalendar {
  id: string;
  summary: string;
}

interface ImportStats {
  total_events: number;
  events_today: number;
  events_this_week: number;
  events_this_month: number;
  last_sync: string | null;
}

const GoogleCalendarPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticStep[]>([]);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Not authenticated");
    }
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const fetchImportStats = useCallback(async () => {
    setIsStatsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_calendar_import_stats').single();
      if (error) throw error;
      setImportStats(data as ImportStats);
    } catch (error: any) {
      toast.error("Failed to fetch import stats.", { description: error.message });
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  const runDiagnostics = useCallback(async () => {
    // ... (existing diagnostics logic)
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
        fetchImportStats();
      }
    } catch (error: any) {
      toast.error("Failed to check Google connection.", { description: error.message });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
      runDiagnostics();
    }
  }, [runDiagnostics, fetchImportStats]);

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
    // ... (existing disconnect logic)
  }, [runDiagnostics]);

  const handleConnect = () => {
    setIsLoading(true);
    login();
  };

  const handleSaveSelection = async () => {
    // ... (existing save logic)
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
          <>
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Import Status</CardTitle>
                <Button variant="ghost" size="sm" onClick={fetchImportStats} disabled={isStatsLoading}>
                  <RefreshCw className={cn("mr-2 h-4 w-4", isStatsLoading && "animate-spin")} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {isStatsLoading ? (
                  <div className="flex items-center justify-center p-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : importStats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{importStats.total_events}</p>
                      <p className="text-sm text-muted-foreground">Total Events</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{importStats.events_today}</p>
                      <p className="text-sm text-muted-foreground">Today</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{importStats.events_this_week}</p>
                      <p className="text-sm text-muted-foreground">This Week</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{importStats.events_this_month}</p>
                      <p className="text-sm text-muted-foreground">This Month</p>
                    </div>
                    <div className="col-span-2 md:col-span-4 text-xs text-muted-foreground pt-2 border-t mt-2">
                      Last sync: {importStats.last_sync ? formatDistanceToNow(new Date(importStats.last_sync), { addSuffix: true, locale: id }) : 'Never'}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">No import data found.</p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <GoogleConnectionStatus steps={diagnostics} onRun={runDiagnostics} />
      </div>
    </PortalLayout>
  );
};

export default GoogleCalendarPage;