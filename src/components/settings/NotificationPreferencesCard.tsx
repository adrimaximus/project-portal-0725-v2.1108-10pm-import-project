import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const notificationTypes = [
  { id: 'project_update', label: 'Project Updates', description: 'When you are added to a project, a task is assigned to you, or a project you are in is updated.' },
  { id: 'mention', label: 'Mentions', description: 'When someone @mentions you in a comment.' },
  { id: 'comment', label: 'New Chat Messages', description: 'When you receive a new message in the chat.' },
  { id: 'goal', label: 'Goal Updates', description: 'When a new goal is created for you.' },
  { id: 'system', label: 'System Notifications', description: 'Important updates and announcements from the system.' },
];

const NotificationPreferencesCard = () => {
  const { user, refreshUser } = useAuth();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

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

  const handlePreferenceChange = async (typeId: string, isEnabled: boolean) => {
    if (!user) return;

    const newPreferences = { ...preferences, [typeId]: isEnabled };
    setPreferences(newPreferences);

    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: newPreferences })
      .eq('id', user.id);

    if (error) {
      toast.error("Failed to update notification setting.");
      // Revert UI change on error
      setPreferences(preferences);
    } else {
      toast.success("Notification setting updated.");
      refreshUser();
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
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesCard;