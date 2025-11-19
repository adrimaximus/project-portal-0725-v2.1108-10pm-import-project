import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Calendar {
    id: string;
    summary: string;
    backgroundColor: string;
    primary?: boolean;
}

const GoogleCalendarIntegrationPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedCalendars, setSelectedCalendars] = useState<Calendar[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);

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

    const { data: calendars = [], isLoading: isLoadingCalendars } = useQuery<Calendar[]>({
        queryKey: ['googleCalendars', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('get-google-calendars');
            if (error) throw error;
            return data || [];
        },
        enabled: !!isConnected,
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
        enabled: !!user && calendars.length > 0,
    });

    useEffect(() => {
        if (profile?.google_calendar_settings?.selected_calendars && calendars.length > 0) {
            const selectedIds = profile.google_calendar_settings.selected_calendars;
            const fullCalendarData = calendars.filter(cal => selectedIds.includes(cal.id));
            setSelectedCalendars(fullCalendarData);
        }
    }, [profile, calendars]);

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
            setSelectedCalendars([]);
            setIsDirty(false);
            queryClient.invalidateQueries({ queryKey: ['googleCalendarConnection', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['googleCalendars', user?.id] });
        }
    };

    const handleCalendarSelectionChange = (calendar: Calendar) => {
        const isSelected = selectedCalendars.some(c => c.id === calendar.id);
        const newSelection = isSelected
            ? selectedCalendars.filter(c => c.id !== calendar.id)
            : [...selectedCalendars, calendar];
        
        setSelectedCalendars(newSelection);

        const originalIds = profile?.google_calendar_settings?.selected_calendars || [];
        const newIds = newSelection.map(c => c.id);
        const isDifferent = JSON.stringify(newIds.sort()) !== JSON.stringify(originalIds.sort());
        setIsDirty(isDifferent);
    };

    const handleSaveSelection = async () => {
        setIsSaving(true);
        try {
            const selectedCalendarIds = selectedCalendars.map(c => c.id);
            const { error } = await supabase.functions.invoke('save-google-calendar-selection', {
                body: { selectedCalendarIds },
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
                        <p className="text-muted-foreground">Connect your Google Calendar account to sync your projects.</p>
                    </div>
                    {isLoadingConnection ? <Loader2 className="h-5 w-5 animate-spin" /> : isConnected && <Badge variant="secondary">Connected</Badge>}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Connect to Google Calendar</CardTitle>
                        <CardDescription>{isConnected ? "Your Google Calendar account is connected." : "Click the button below to connect your account."}</CardDescription>
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
                            <CardDescription>Choose which calendars you want to sync with your projects.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingCalendars ? (
                                <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /><p className="ml-2 text-muted-foreground">Loading calendars...</p></div>
                            ) : (
                                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="w-full justify-between h-auto min-h-10">
                                            <div className="flex flex-wrap gap-1">
                                                {selectedCalendars.length > 0 ? selectedCalendars.map(cal => (
                                                    <Badge key={cal.id} variant="secondary" className="flex items-center gap-1">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cal.backgroundColor }}></div>
                                                        {cal.summary}
                                                    </Badge>
                                                )) : "Select calendars..."}
                                            </div>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search calendars..." />
                                            <CommandList>
                                                <CommandEmpty>No calendars found.</CommandEmpty>
                                                <CommandGroup>
                                                    {calendars.map((cal) => (
                                                        <CommandItem key={cal.id} onSelect={() => handleCalendarSelectionChange(cal)}>
                                                            <Check className={cn("mr-2 h-4 w-4", selectedCalendars.some(c => c.id === cal.id) ? "opacity-100" : "opacity-0")}/>
                                                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cal.backgroundColor }}></div>
                                                            <span className="flex-1">{cal.summary}</span>
                                                            {cal.primary && <Badge variant="outline" className="ml-2">Primary</Badge>}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
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