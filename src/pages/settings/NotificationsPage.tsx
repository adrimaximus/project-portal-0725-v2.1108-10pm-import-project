import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface NotificationEvent {
  id: string;
  label: string;
  description: string;
  category: string;
  default_channels: string[];
}

interface UserPreferences {
  [key: string]: {
    [channel: string]: boolean;
  };
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const NotificationsPage = () => {
  const { user, profile, fetchProfile } = useAuth();
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchNotificationSettings = useCallback(async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('notification_events')
        .select('*');

      if (eventsError) throw eventsError;

      setEvents(eventsData || []);
      setPreferences(profile.notification_preferences || {});
    } catch (error: any) {
      toast.error('Failed to load notification settings.', { description: error.message });
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    fetchNotificationSettings();
  }, [fetchNotificationSettings]);

  const handleToggle = (eventId: string, channel: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [channel]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const toastId = toast.loading('Saving preferences...');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: preferences })
        .eq('id', user.id);

      if (error) throw error;
      
      await fetchProfile(); // Refresh profile context
      toast.success('Preferences saved successfully!', { id: toastId });
    } catch (error: any) {
      toast.error('Failed to save preferences.', { id: toastId, description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const groupedEvents = events.reduce((acc, event) => {
    const category = event.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(event);
    return acc;
  }, {} as Record<string, NotificationEvent[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Notification Preferences</h1>
        <p className="text-muted-foreground mt-2">Manage how you receive notifications across different channels.</p>
      </header>
      
      <div className="space-y-8">
        {Object.entries(groupedEvents).map(([category, categoryEvents]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{capitalize(category)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {categoryEvents.map((event, index) => (
                <div key={event.id}>
                  {index > 0 && <Separator className="mb-6" />}
                  <div>
                    <Label htmlFor={event.id} className="text-base font-semibold">{event.label}</Label>
                    <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                    {['in-app', 'email', 'whatsapp'].map(channel => (
                      <div key={channel} className="flex items-center space-x-2">
                        <Switch
                          id={`${event.id}-${channel}`}
                          checked={preferences[event.id]?.[channel] !== false}
                          onCheckedChange={(value) => handleToggle(event.id, channel, value)}
                        />
                        <Label htmlFor={`${event.id}-${channel}`}>{capitalize(channel)}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <footer className="mt-8 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>
      </footer>
    </div>
  );
};

export default NotificationsPage;