import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";

const GoogleCalendarIntegrationPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const { data: isConnected, isLoading: isLoadingConnection } = useQuery({
        queryKey: ['googleCalendarConnection', user?.id],
        queryFn: async () => {
            if (!user) return false;
            const { data, error } = await supabase
                .from('google_calendar_tokens')
                .select('user_id')
                .eq('user_id', user.id)
                .maybeSingle();
            if (error && error.code !== 'PGRST116') throw error;
            return !!data;
        },
        enabled: !!user,
    });

    const { data: profile } = useQuery({
        queryKey: ['userProfileGCalSettings', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase
                .from('profiles')
                .select('google_calendar_settings')
                .eq('id', user.id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    useEffect(() => {
        if (profile?.google_calendar_settings?.selected_calendars) {
            setSelectedCalendars(profile.google_calendar_settings.selected_calendars);
        }
    }, [profile]);

    const { data: calendars = [], isLoading: isLoadingCalendars } = useQuery({
        queryKey: ['googleCalendars', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('get-google-calendars', { method: 'GET' });
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
            const { data, error } = await supabase.functions.invoke('google-calendar-auth', { method: 'GET' });
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
        }
    };

    const handleCalendarSelectionChange = (calendarId: string) => {
        const newSelection = selectedCalendars.includes(calendarId)
            ? selectedCalendars.filter(id => id !== calendarId)
            : [...selectedCalendars, calendarId];
        
        setSelectedCalendars(newSelection);

        const originalSelection = profile?.google_calendar_settings?.selected_calendars || [];
        const isDifferent = JSON.stringify(newSelection.sort()) !== JSON.stringify(originalSelection.sort());
        setIsDirty(isDifferent);
    };

    const handleSaveSelection = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase.functions.invoke('save-google-calendar-selection', {
                body: { selectedCalendarIds: selectedCalendars },
            });
            if (error) throw error;
            toast.success("Your calendar selection has been saved.");
            setIsDirty(false);
            queryClient.invalidateQueries({ queryKey: ['userProfileGCalSettings', user?.id] });
        } catch (error: any) {
            toast.error("Failed to save selection.", { description: error.message });
        } finally {
            setIsSaving(false);
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
                            <CardTitle>Select Calendars to Sync</CardTitle>
                            <CardDescription>Choose one or more calendars you want to sync with your projects.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingCalendars ? (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    <p className="ml-2 text-muted-foreground">Loading calendars...</p>
                                </div>
                            ) : calendars.length > 0 ? (
                                <ul className="space-y-2">
                                    {calendars.map((cal: any) => (
                                        <li key={cal.id}>
                                            <label htmlFor={cal.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        id={cal.id}
                                                        checked={selectedCalendars.includes(cal.id)}
                                                        onCheckedChange={() => handleCalendarSelectionChange(cal.id)}
                                                    />
                                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: cal.backgroundColor }}></div>
                                                    <span>{cal.summary}</span>
                                                </div>
                                                {cal.primary && <Badge variant="default">Primary</Badge>}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center p-4">No calendars found or failed to load.</p>
                            )}
                        </CardContent>
                        {calendars.length > 0 && (
                            <CardFooter className="flex justify-end">
                                <Button onClick={handleSaveSelection} disabled={!isDirty || isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                )}
            </div>
        </PortalLayout>
    );
};

export default GoogleCalendarIntegrationPage;