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

const GoogleCalendarPageContent = () => {
  const [clientId, setClientId] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const storedStatus = localStorage.getItem("gcal_connected");
    const storedClientId = localStorage.getItem("gcal_clientId");
    if (storedStatus === "true" && storedClientId) {
      setIsConnected(true);
      setClientId(storedClientId);
    }
  }, []);

  const handleConnectSuccess = (tokenResponse: Omit<TokenResponse, "error" | "error_description" | "error_uri">) => {
    localStorage.setItem("gcal_connected", "true");
    localStorage.setItem("gcal_clientId", clientId);
    localStorage.setItem("gcal_access_token", tokenResponse.access_token);
    setIsConnected(true);
    toast.success("Successfully connected to Google Calendar!");
  };

  const handleConnectError = () => {
    toast.error("Google Calendar connection failed. Please check your Client ID and try again.");
  };

  const login = useGoogleLogin({
    onSuccess: handleConnectSuccess,
    onError: handleConnectError,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
  });

  const handleDisconnect = () => {
    localStorage.removeItem("gcal_connected");
    localStorage.removeItem("gcal_clientId");
    localStorage.removeItem("gcal_access_token");
    setIsConnected(false);
    setClientId("");
    toast.info("Disconnected from Google Calendar.");
  };

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
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            {isConnected ? (
              <Button variant="outline" onClick={handleDisconnect}>Disconnect</Button>
            ) : (
              <Button onClick={() => login()} disabled={!clientId}>Connect with Google</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </PortalLayout>
  );
};

const GoogleCalendarPage = () => {
    const clientId = localStorage.getItem("gcal_clientId") || "";
    // The provider needs a client ID on initial load, even if we change it later.
    // We use a state for the input field, but the provider can take the stored one.
    return (
        <GoogleOAuthProvider clientId={clientId}>
            <GoogleCalendarPageContent />
        </GoogleOAuthProvider>
    )
}

export default GoogleCalendarPage;