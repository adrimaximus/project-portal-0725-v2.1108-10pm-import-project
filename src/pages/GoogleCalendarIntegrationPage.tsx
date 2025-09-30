import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

const GoogleCalendarIntegrationPage = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [calendars, setCalendars] = useState<any[]>([]);
    const [loadingCalendars, setLoadingCalendars] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const isConnected = !!session?.provider_token && session.user.app_metadata.provider === 'google';

    useEffect(() => {
        const fetchCalendars = async () => {
            if (session?.provider_token) {
                setLoadingCalendars(true);
                try {
                    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
                        headers: {
                            'Authorization': `Bearer ${session.provider_token}`,
                        },
                    });
                    if (!response.ok) {
                        // This can happen if the token expires. A real app would handle token refresh.
                        if (response.status === 401) {
                            // Attempt to sign out to clear the invalid session
                            await supabase.auth.signOut();
                        }
                        throw new Error('Failed to fetch calendars');
                    }
                    const data = await response.json();
                    setCalendars(data.items || []);
                } catch (error) {
                    console.error("Error fetching calendars:", error);
                    setCalendars([]);
                } finally {
                    setLoadingCalendars(false);
                }
            }
        };

        if (isConnected) {
            fetchCalendars();
        } else {
            setCalendars([]);
        }
    }, [session, isConnected]);

    const handleConnect = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: 'https://www.googleapis.com/auth/calendar.readonly',
                redirectTo: window.location.href,
            },
        });
        if (error) {
            console.error("Error connecting to Google Calendar:", error.message);
        }
    };

    const handleDisconnect = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error disconnecting from Google Calendar:", error.message);
        }
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
                                <p className="text-sm text-muted-foreground">Connected as {session?.user?.email}</p>
                                <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
                            </div>
                        ) : (
                            <Button onClick={handleConnect}>Connect Google Calendar</Button>
                        )}
                    </CardContent>
                </Card>

                {isConnected && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Calendars</CardTitle>
                            <CardDescription>
                                Here is a list of your calendars from your Google account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingCalendars ? (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    <p className="ml-2 text-muted-foreground">Loading calendars...</p>
                                </div>
                            ) : calendars.length > 0 ? (
                                <ul className="space-y-2">
                                    {calendars.map((cal) => (
                                        <li key={cal.id} className="flex items-center justify-between p-2 border rounded-md">
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded" style={{ backgroundColor: cal.backgroundColor }}></div>
                                                <span>{cal.summary}</span>
                                            </div>
                                            {cal.primary && <Badge variant="default">Primary</Badge>}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center p-4">No calendars found or failed to load.</p>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </PortalLayout>
    );
};

export default GoogleCalendarIntegrationPage;