import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";

const GoogleCalendarPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log(tokenResponse);
      toast.success("Successfully connected to Google Calendar!");
      setIsLoading(false);
      // In a real application, you would send the access token to your backend
      // to be stored securely and used to sync calendar data.
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
      </div>
    </PortalLayout>
  );
};

export default GoogleCalendarPage;