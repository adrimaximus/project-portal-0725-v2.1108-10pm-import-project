import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const GoogleCalendarIntegrationPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isConnecting, setIsConnecting] = useState(false);

    const { data: isConnected, isLoading: isLoadingConnection } = useQuery({
        queryKey: ['googleCalendarConnection', user?.id],
        queryFn: async () => {
            if (!user) return false;
            const { data, error } = await supabase
                .from('google_calendar_tokens')
                .select('user_id')
                .eq('user_id', user.id)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return !!data;
        },
        enabled: !!user,
    });

    const { data: calendars = [], isLoading: isLoadingCalendars } = useQuery({
        queryKey: ['googleCalendars', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('get-google-calendars');
            if (error) throw error;
            return data || [];
        },
        enabled: !!isConnected,
    });

    useEffect(() => {
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        if (success) {
            toast.success("Successfully connected to Google Calendar!");
            queryClient.invalidateQueries({ queryKey: ['googleCalendarConnection', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['googleCalendars', user?.id] });
            searchParams.delete('success');
            setSearchParams(searchParams);
        }
        if (error) {
            toast.error("Failed to connect to Google Calendar.", { description: error });
            searchParams.delete('error');
            setSearchParams(searchParams);
        }
    }, [searchParams, setSearchParams, queryClient, user?.id]);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            const { data, error } = await supabase.functions.invoke('google-calendar-auth');
            if (error) throw error;
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error: any) {
            toast.error("Could not get authorization URL.", { description: error.message });
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        const { error } = await supabase.rpc('delete_google_calendar_tokens');
        if (error) {
            toast.error("Failed to disconnect.", { description: error.message });
        } else {
            toast.success("Disconnected from Google Calendar.");
            queryClient.invalidateQueries({ queryKey: ['googleCalendarConnection', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['googleCalendars', user?.id] });
        }
    };

    return (
        <PortalLayout>
            <div className="space-y-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild><Link to="/settings">Settings</Link></BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild><Link to="/settings/integrations">Integrations</Link></BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Google Calendar</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Google Calendar Integration</h1>
                        <p className="text-muted-foreground">Connect your Google Calendar account to sync your projects.</p>
                    </div>
                    {isLoadingConnection ? <Loader2 className="h-5 w-5 animate-spin" /> : isConnected && <Badge variant="secondary">Connected</Badge>}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Connect to Google Calendar</CardTitle>
                        <CardDescription>
                            {isConnected ? "Your Google Calendar account is connected." : "Click the button below to connect your account."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isConnected ? (
                             <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Connected as {user?.email}</p>
                                <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
                            </div>
                        ) : (
                            <Button onClick={handleConnect} disabled={isConnecting}>
                                {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Connect Google Calendar
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {isConnected && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Calendars</CardTitle>
                            <CardDescription>Here is a list of your calendars from your Google account.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingCalendars ? (
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