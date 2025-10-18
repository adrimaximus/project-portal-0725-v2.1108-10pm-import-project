import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, BellRing } from "lucide-react";
import TestNotificationToast from "./TestNotificationToast";
import { Button } from "../ui/button";

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
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

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

  const handleRequestPermission = () => {
    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
      if (permission === "granted") {
        toast.success("Desktop notifications enabled!");
        new Notification("Notifications Enabled", {
          body: "You will now receive desktop notifications.",
          icon: "/favicon.ico",
        });
      } else if (permission === "denied") {
        toast.error("Desktop notifications blocked.", {
          description: "You'll need to change this in your browser settings.",
        });
      }
    });
  };

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

  const getIsEnabled = (typeId: string) => {
    const pref = preferences[typeId];
    if (typeof pref === 'object' && pref !== null) {
      return pref.enabled !== false;
    }
    return pref !== false;
  };

  const handlePreferenceChange = async (typeId: string, isEnabled: boolean) => {
    const newPreferences = { ...preferences };
    const currentPref = newPreferences[typeId];

    if (typeof currentPref === 'object' && currentPref !== null) {
      newPreferences[typeId] = { ...currentPref, enabled: isEnabled };
    } else {
      newPreferences[typeId] = { enabled: isEnabled };
    }
    
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
      const audio = new Audio(`${TONE_BASE_URL}${toneValue}`);
      audio.play().catch(e => console.error("Error playing audio preview:", e));
    }
    
    const newPreferences = { ...preferences };
    const currentCommentPref = newPreferences['comment'];
    
    if (typeof currentCommentPref === 'object' && currentCommentPref !== null) {
        newPreferences['comment'] = { ...currentCommentPref, sound: toneValue };
    } else {
        newPreferences['comment'] = { enabled: currentCommentPref !== false, sound: toneValue };
    }

    const success = await updatePreferences(newPreferences);
    if (success) {
      toast.success("Notification tone updated.");
    }
  };

  const handleGlobalToggle = async (key: 'toast_enabled' | 'whatsapp_enabled' | 'email_enabled', isEnabled: boolean) => {
    const newPreferences = { ...preferences, [key]: isEnabled };
    const success = await updatePreferences(newPreferences);
    if (success) {
      toast.success("Notification setting updated.");
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
                      <Label htmlFor="desktop-notifications" className="text-base">Enable Desktop Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications even when the app is in the background.</p>
                  </div>
                  {notificationPermission === 'granted' ? (
                    <span className="text-sm font-medium text-green-600">Enabled</span>
                  ) : (
                    <Button onClick={handleRequestPermission} size="sm">
                      <BellRing className="mr-2 h-4 w-4" />
                      Enable
                    </Button>
                  )}
              </div>
          </div>
          <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                      <Label htmlFor="toast-notifications" className="text-base">Enable In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground">Show pop-up notifications on screen while using the app.</p>
                  </div>
                  <Switch
                    id="toast-notifications"
                    checked={preferences.toast_enabled !== false}
                    onCheckedChange={(checked) => handleGlobalToggle('toast_enabled', checked)}
                  />
              </div>
          </div>
          <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                      <Label htmlFor="whatsapp-notifications" className="text-base">Enable WhatsApp Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive reminders and important updates directly on WhatsApp.</p>
                  </div>
                  <Switch
                    id="whatsapp-notifications"
                    checked={preferences.whatsapp_enabled !== false}
                    onCheckedChange={(checked) => handleGlobalToggle('whatsapp_enabled', checked)}
                  />
              </div>
          </div>
          <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                      <Label htmlFor="email-notifications" className="text-base">Enable Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive summaries and important updates in your email inbox.</p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={preferences.email_enabled !== false}
                    onCheckedChange={(checked) => handleGlobalToggle('email_enabled', checked)}
                  />
              </div>
          </div>
          <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                      <Label htmlFor="notification-tone" className="text-base">Notification Tone</Label>
                      <p className="text-sm text-muted-foreground">Select a sound for incoming notifications.</p>
                  </div>
                  <Select value={preferences.comment?.sound || 'none'} onValueChange={handleToneChange}>
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
                  checked={getIsEnabled(type.id)}
                  onCheckedChange={(checked) => handlePreferenceChange(type.id, checked)}
                />
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesCard;