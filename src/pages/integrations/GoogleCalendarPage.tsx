import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

const GoogleCalendarPage = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('google_access_token');
    if (token) {
      setIsConnected(true);
    }
  }, []);

  const fetchAndStoreCalendarEvents = async (accessToken: string) => {
    try {
      // First, get the list of calendars
      const calendarListResponse = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const calendarListData = await calendarListResponse.json();

      if (!calendarListData.items) {
        toast.warning('Connected to Google, but could not fetch calendar list.');
        return;
      }

      const allEvents: any[] = [];
      const timeMin = new Date().toISOString(); // Fetch events from now onwards

      // Fetch events from each calendar
      for (const calendar of calendarListData.items) {
        const eventResponse = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events?timeMin=${timeMin}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const eventData = await eventResponse.json();
        if (eventData.items) {
          allEvents.push(...eventData.items);
        }
      }
      
      localStorage.setItem('googleCalendarEvents', JSON.stringify(allEvents));
      toast.success(`Successfully fetched ${allEvents.length} upcoming events.`);
      window.dispatchEvent(new Event('storage')); // Notify other components of the update

    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to fetch calendar data after connecting.');
    }
  };

  const handleSuccess = async (tokenResponse: any) => {
    setIsConnecting(false);
    setIsConnected(true);
    localStorage.setItem('google_access_token', tokenResponse.access_token);
    toast.success('Successfully connected to Google Calendar.');
    await fetchAndStoreCalendarEvents(tokenResponse.access_token);
  };

  const handleError = (error: any) => {
    console.error('Google login error:', error);
    toast.error('Failed to connect to Google Calendar.');
    setIsConnecting(false);
  };

  const login = useGoogleLogin({
    onSuccess: handleSuccess,
    onError: handleError,
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly',
  });

  const handleConnect = () => {
    setIsConnecting(true);
    login();
  };

  const handleDisconnect = () => {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('googleCalendarEvents');
    setIsConnected(false);
    toast.info('Disconnected from Google Calendar.');
    window.dispatchEvent(new Event('storage')); // Notify other components of the update
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
            <CardTitle>Google Calendar Integration</CardTitle>
            <CardDescription>Connect your Google Calendar to sync events and meetings directly into your projects.</CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">Connected to Google Calendar</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your calendar events are now being synced. You can manage them from the projects dashboard.
                </p>
                <Button onClick={handleDisconnect} variant="destructive">
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default GoogleCalendarPage;