import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const GoogleCalendarIntegrationPage = () => {
    // In a real app, this would come from an API or context
    const [isConnected, setIsConnected] = useState(false);

    const handleConnect = () => {
        // Placeholder for OAuth flow
        console.log("Connecting to Google Calendar...");
        // For demonstration, we'll just toggle the state
        setIsConnected(true);
    };

    const handleDisconnect = () => {
        console.log("Disconnecting from Google Calendar...");
        setIsConnected(false);
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
                            Connect your Google Calendar account to sync your projects.
                        </p>
                    </div>
                    {isConnected && <Badge variant="secondary">Connected</Badge>}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Connect to Google Calendar</CardTitle>
                        <CardDescription>
                            {isConnected 
                                ? "Your Google Calendar account is connected."
                                : "Click the button below to connect your account."
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isConnected ? (
                             <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Your account is successfully connected.</p>
                                <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
                            </div>
                        ) : (
                            <Button onClick={handleConnect}>Connect Google Calendar</Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PortalLayout>
    );
};

export default GoogleCalendarIntegrationPage;