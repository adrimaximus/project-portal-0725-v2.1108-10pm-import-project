import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const GoogleCalendarIntegrationPage = () => {
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
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Google Calendar Integration
          </h1>
          <p className="text-muted-foreground">
            Connect your Google Calendar account to sync your projects.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connect to Google Calendar</CardTitle>
            <CardDescription>
              Click the button below to connect your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Connect Google Calendar</Button>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default GoogleCalendarIntegrationPage;