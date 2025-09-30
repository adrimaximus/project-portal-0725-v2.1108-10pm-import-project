import { useState, useEffect } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useGoogleLogin, TokenResponse } from '@react-oauth/google';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Calendar {
  id: string;
  summary: string;
  backgroundColor: string;
}

interface GoogleCalendarSettings {
  selectedCalendars?: string[];
  token?: Omit<TokenResponse, 'error' | 'error_uri' | 'error_description'>;
}

const GoogleCalendarIntegrationPage = () => {
  const { user, refreshUser } = useAuth();
  const [settings, setSettings] = useState<GoogleCalendarSettings | null>(null);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('google_calendar_settings')
        .eq('id', user.id)
        .single();

      if (error) {
        toast.error("Failed to load Google Calendar settings.");
      } else if (data && data.google_calendar_settings) {
        const savedSettings = data.google_calendar_settings as GoogleCalendarSettings;
        setSettings(savedSettings);
        setSelectedCalendars(savedSettings.selectedCalendars || []);
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, [user]);

  const saveSettings = async (newSettings: GoogleCalendarSettings) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ google_calendar_settings: newSettings })
      .eq('id', user.id);
    if (error) {
      toast.error("Failed to save settings.");
      throw error;
    }
    await refreshUser();
  };

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const newSettings = { ...settings, token: tokenResponse };
      setSettings(newSettings);
      toast.success("Successfully connected to Google Calendar.");
      await saveSettings(newSettings);
    },
    onError: () => {
      toast.error("Google Calendar connection failed.");
    },
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
  });

  useEffect(() => {
    if (settings?.token) {
      const fetchCalendars = async () => {
        setIsLoading(true);
        try {
          const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
            headers: {
              Authorization: `Bearer ${settings.token!.access_token}`,
            },
          });
          if (!response.ok) {
            if (response.status === 401) {
                toast.info("Your Google session has expired. Please reconnect.");
                const newSettings = { ...settings, token: undefined };
                setSettings(newSettings);
                await saveSettings(newSettings);
            } else {
                throw new Error(`Failed to fetch calendars: ${response.statusText}`);
            }
          }
          const data = await response.json();
          setCalendars(data.items);
        } catch (error: any) {
          toast.error("Failed to fetch calendars.", { description: error.message });
        } finally {
          setIsLoading(false);
        }
      };
      fetchCalendars();
    }
  }, [settings?.token]);

  const handleSelectCalendar = (calendarId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCalendars(prev => [...prev, calendarId]);
    } else {
      setSelectedCalendars(prev => prev.filter(id => id !== calendarId));
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const newSettings = { ...settings, selectedCalendars };
      await saveSettings(newSettings as GoogleCalendarSettings);
      setSettings(newSettings as GoogleCalendarSettings);
      toast.success("Your calendar preferences have been saved.");
    } catch (error) {
      // Error is already handled in saveSettings
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    const newSettings = { selectedCalendars: [], token: undefined };
    await saveSettings(newSettings);
    setSettings(newSettings);
    setCalendars([]);
    setSelectedCalendars([]);
    toast.info("Disconnected from Google Calendar.");
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
              {settings?.token ? "You are connected. Select the calendars you want to sync." : "Click the button below to connect your account."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : !settings?.token ? (
              <Button onClick={() => login()}>Connect Google Calendar</Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {calendars.map(calendar => (
                    <div key={calendar.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                      <Checkbox
                        id={calendar.id}
                        checked={selectedCalendars.includes(calendar.id)}
                        onCheckedChange={(checked) => handleSelectCalendar(calendar.id, !!checked)}
                      />
                      <Label htmlFor={calendar.id} className="flex items-center gap-2 cursor-pointer">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: calendar.backgroundColor }} />
                        {calendar.summary}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default GoogleCalendarIntegrationPage;