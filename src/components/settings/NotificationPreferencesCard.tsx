import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, BellRing } from "lucide-react";
import TestNotificationToast from "./TestNotificationToast";
import { Button } from "@/components/ui/button";
import { useAudio } from "@/contexts/AudioContext";

const notificationTypes = [
  { id: 'project_update', label: 'Project Updates', description: 'When you are added to a project, a task is assigned to you, or a project you are in is updated.' },
  { id: 'mention', label: 'Mentions', description: 'When someone @mentions you in a comment.' },
  { id: 'comment', label: 'New Chat Messages', description: 'When you receive a new message and are not on the chat page.' },
  { id: 'goal', label: 'Goal Updates', description: 'When a new goal is created for you.' },
  { id: 'system', label: 'System Notifications', description: 'Important updates and announcements from the system.' },
];

const notificationTones = [
    { name: 'No Tone', value: 'none' },
    { name: 'Digital Bell FX', value: 'digital-bell-fx.mp3' },
    { name: 'Digital Bell SmartSound', value: 'digital-bell-smartsound.mp3' },
    { name: 'Double Bells', value: 'double-bells.mp3' },
    { name: 'Fluttery Digital Bell', value: 'fluttery-digital-bell.mp3' },
    { name: 'High Bling', value: 'high-bling.mp3' },
    { name: 'Positive Alert Ding', value: 'positive-alert-ding.mp3' },
];

const TONE_BASE_URL = `https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/Notification/`;

const NotificationPreferencesCard = () => {
  const { user, refreshUser } = useAuth();
  const { play: playSound } = useAudio();
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const fetchPreferences = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();
        
        if (error) {
          toast.error("Failed to load notification settings.");
        } else if (data?.notification_preferences) {
          setPreferences(data.notification_preferences);
        }
        setIsLoading(false);
      };
      fetchPreferences();
    }
  }, [user?.id]);

  const updatePreferences = async (newPreferences: Record<string, any>) => {
    if (!user) return;

    const oldPreferences = { ...preferences };
    setPreferences(newPreferences);

    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: newPreferences })
      .eq('id', user.id);

    if (error) {
      toast.error("Failed to update notification setting.");
      setPreferences(oldPreferences); // Revert on error
      return false;
    }
    
    refreshUser();
    return true;
  };

  const handlePreferenceChange = async (typeId: string, isEnabled: boolean) => {
    const newPreferences = { ...preferences, [typeId]: isEnabled };
    const success = await updatePreferences(newPreferences);
    if (success) {
      if (isEnabled) {
        const notificationType = notificationTypes.find(t => t.id === typeId);
        toast(<TestNotificationToast user={user} type={notificationType} />);
      } else {
        toast.success("Notification setting updated.");
      }
    }
  };

  const handleToneChange = async (toneValue: string) => {
    if (toneValue !== 'none') {
      playSound(`${TONE_BASE_URL}${toneValue}`);
    }
    
    const newPreferences = { ...preferences, tone: toneValue };
    const success = await updatePreferences(newPreferences);
    if (success) {
      toast.success("Notification tone updated.");
    }
  };

  const handleGlobalToastToggle = async (isEnabled: boolean) => {
    const newPreferences = { ...preferences, toast_enabled: isEnabled };
    const success = await updatePreferences(newPreferences);
    if (success) {
      toast.success("Toast notification setting updated.");
    }
  };

  const handleSendTest = async () => {
    if (!user) return;
    setIsTesting(true);
    const toastId = toast.loading("Sending test notification...");
    const { error } = await supabase.rpc('send_test_notification');
    setIsTesting(false);
    if (error) {
        toast.error("Failed to send test notification.", { id: toastId, description: error.message });
    } else {
        toast.success("Test notification sent!", { id: toastId, description: "You should see it and hear a sound if enabled." });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Manage how you receive notifications from the platform.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Manage how you receive notifications from the platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                      <Label htmlFor="toast-notifications" className="text-base">Enable Toast Notifications</Label>
                      <p className="text-sm text-muted-foreground">Show pop-up notifications on screen.</p>
                  </div>
                  <Switch
                    id="toast-notifications"
                    checked={preferences.toast_enabled !== false} // Default to true
                    onCheckedChange={handleGlobalToastToggle}
                  />
              </div>
          </div>
          <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                      <Label htmlFor="notification-tone" className="text-base">Notification Tone</Label>
                      <p className="text-sm text-muted-foreground">Select a sound for incoming notifications.</p>
                  </div>
                  <Select value={preferences.tone || 'none'} onValueChange={handleToneChange}>
                      <SelectTrigger className="w-[240px]">
                          <SelectValue placeholder="Select a tone" />
                      </SelectTrigger>
                      <SelectContent>
                          {notificationTones.map((tone) => (
                              <SelectItem key={tone.value} value={tone.value}>
                                  {tone.name}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
          </div>
        </div>
        <div className="space-y-4">
            {notificationTypes.map((type) => (
              <div key={type.id} className="flex items-start justify-between rounded-lg border p-4">
                <div className="space-y-0.5 pr-4">
                  <Label htmlFor={`notif-${type.id}`} className="text-base">{type.label}</Label>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
                <Switch
                  id={`notif-${type.id}`}
                  checked={preferences[type.id] !== false} // Default to true if not set
                  onCheckedChange={(checked) => handlePreferenceChange(type.id, checked)}
                />
              </div>
            ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={handleSendTest} disabled={isTesting}>
          {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}
          Send Test Notification
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationPreferencesCard;