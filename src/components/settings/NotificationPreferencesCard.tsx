import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Volume2 } from "lucide-react";

const notificationTypes = [
  { id: 'project_update', label: 'Project Updates', description: 'When you are added to a project, a task is assigned to you, or a project you are in is updated.' },
  { id: 'mention', label: 'Mentions', description: 'When someone @mentions you in a comment.' },
  { id: 'comment', label: 'New Chat Messages', description: 'When you receive a new message in the chat.' },
  { id: 'goal', label: 'Goal Updates', description: 'When a new goal is created for you.' },
  { id: 'system', label: 'System Notifications', description: 'Important updates and announcements from the system.' },
];

interface NotificationSetting {
  enabled: boolean;
  sound: string;
}

const NotificationPreferencesCard = () => {
  const { user, refreshUser } = useAuth();
  const [preferences, setPreferences] = useState<Record<string, NotificationSetting>>({});
  const [notificationSounds, setNotificationSounds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSounds = async () => {
      const { data, error } = await supabase.storage.from('General').list('Notification');
      if (error) {
        console.error("Error fetching notification sounds:", error);
        toast.error("Could not load notification sounds.");
        setNotificationSounds(['None']);
      } else {
        const soundFiles = data
          .filter(file => file.name !== '.emptyFolderPlaceholder' && (file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.ogg')))
          .map(file => file.name);
        setNotificationSounds(['None', ...soundFiles]);
      }
    };
    fetchSounds();
  }, []);

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
        } else {
          const savedPrefs = data?.notification_preferences || {};
          const newPrefs: Record<string, NotificationSetting> = {};
          
          notificationTypes.forEach(type => {
            const savedPref = savedPrefs[type.id];
            if (typeof savedPref === 'boolean') {
              // Migrate from old format
              newPrefs[type.id] = { enabled: savedPref, sound: 'None' };
            } else if (savedPref && typeof savedPref === 'object') {
              // Use new format, mapping 'Default' to 'None' for legacy users
              newPrefs[type.id] = { enabled: savedPref.enabled !== false, sound: savedPref.sound === 'Default' ? 'None' : (savedPref.sound || 'None') };
            } else {
              // Default value
              newPrefs[type.id] = { enabled: true, sound: 'None' };
            }
          });
          setPreferences(newPrefs);
        }
        setIsLoading(false);
      };
      fetchPreferences();
    }
  }, [user?.id]);

  const playSound = (soundFile: string) => {
    if (soundFile === 'None' || !soundFile) return;
    const { data } = supabase.storage.from('General').getPublicUrl(`Notification/${soundFile}`);
    if (data.publicUrl) {
      const audio = new Audio(data.publicUrl);
      audio.play().catch(e => console.error("Error playing audio:", e));
    }
  };

  const handlePreferenceChange = async (typeId: string, newSetting: Partial<NotificationSetting>) => {
    if (!user) return;

    const oldPreferences = { ...preferences };
    const currentSetting = preferences[typeId] || { enabled: true, sound: 'None' };
    const updatedSetting = { ...currentSetting, ...newSetting };
    
    const newPreferences = { ...preferences, [typeId]: updatedSetting };
    setPreferences(newPreferences);

    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: newPreferences })
      .eq('id', user.id);

    if (error) {
      toast.error("Failed to update notification setting.");
      setPreferences(oldPreferences); // Revert UI change on error
    } else {
      toast.success("Notification setting updated.");
      if (newSetting.sound && updatedSetting.enabled) {
        playSound(newSetting.sound);
      }
      refreshUser();
    }
  };

  if (isLoading || notificationSounds.length === 0) {
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
        <CardDescription>Manage how you receive notifications from the platform and their sounds.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notificationTypes.map((type) => (
          <div key={type.id} className="flex items-start justify-between rounded-lg border p-4">
            <div className="space-y-0.5 pr-4 flex-grow">
              <Label htmlFor={`notif-switch-${type.id}`} className="text-base">{type.label}</Label>
              <p className="text-sm text-muted-foreground">{type.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select
                value={preferences[type.id]?.sound || 'None'}
                onValueChange={(sound) => handlePreferenceChange(type.id, { sound })}
                disabled={!preferences[type.id]?.enabled}
              >
                <SelectTrigger className="w-[180px]">
                  <Volume2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select sound" />
                </SelectTrigger>
                <SelectContent>
                  {notificationSounds.map(sound => (
                    <SelectItem key={sound} value={sound}>
                      {sound === 'None' ? 'Tanpa Suara' : sound.split('.')[0].replace(/[-_]/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Switch
                id={`notif-switch-${type.id}`}
                checked={preferences[type.id]?.enabled !== false}
                onCheckedChange={(checked) => handlePreferenceChange(type.id, { enabled: checked })}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesCard;