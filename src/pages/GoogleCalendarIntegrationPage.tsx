import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2 } from "lucide-react";

const GoogleCalendarIntegrationPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.provider_token) {
        handleSaveConnection();
      }
    });

    checkConnectionStatus();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkConnectionStatus = async () => {
    setIsFetchingStatus(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('google_calendar_settings')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Failed to get connection status:", error);
      } else if (data?.google_calendar_settings?.connected) {
        setIsConnected(true);
      }
    }
    setIsFetchingStatus(false);
  };

  const handleSaveConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          google_calendar_settings: { 
            connected: true,
          } 
        })
        .eq('id', user.id);
      
      if (updateError) {
        showError("Failed to save connection status: " + updateError.message);
      } else {
        showSuccess("Successfully connected to Google Calendar!");
        setIsConnected(true);
        navigate('/settings/integrations/google-calendar', { replace: true });
      }
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/calendar.readonly',
        redirectTo: `${window.location.origin}/settings/integrations/google-calendar`
      }
    });

    if (error) {
      showError("Failed to connect to Google Calendar: " + error.message);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ google_calendar_settings: { connected: false } })
        .eq('id', user.id);
      
      if (error) {
        showError("Failed to disconnect: " + error.message);
      } else {
        showSuccess("Successfully disconnected from Google Calendar.");
        setIsConnected(false);
      }
    }
    setIsLoading(false);
  };

  const renderContent = () => {
    if (isFetchingStatus) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (isConnected) {
      return (
        <>
          <p className="text-sm text-green-600 mb-4">
            You are connected to Google Calendar.
          </p>
          <Button onClick={handleDisconnect} variant="destructive" disabled={isLoading}>
            {isLoading ? "Disconnecting..." : "Disconnect from Google Calendar"}
          </Button>
        </>
      );
    }

    return (
      <>
        <p className="text-sm text-muted-foreground mb-4">
          By connecting your Google Calendar, you can see your project deadlines and tasks directly in your calendar, helping you stay organized and on top of your schedule.
        </p>
        <Button onClick={handleConnect} disabled={isLoading}>
          {isLoading ? "Connecting..." : "Connect to Google Calendar"}
        </Button>
      </>
    );
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
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/FileGoogle%20Calendar%20icon%20(2020).svg%20-%20Wikimedia%20Commons.png" alt="Google Calendar icon" className="h-8 w-8" />
              <div>
                <CardTitle>Google Calendar</CardTitle>
                <CardDescription>Sync your projects and tasks with Google Calendar.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default GoogleCalendarIntegrationPage;