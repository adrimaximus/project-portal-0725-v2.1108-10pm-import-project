import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, BellRing } from "lucide-react";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import WhatsappIcon from "../icons/WhatsappIcon";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail } from "lucide-react";
import { PAYMENT_STATUS_OPTIONS } from "@/types";

interface NotificationEvent {
  id: string;
  label: string;
  description: string | null;
  category: string | null;
  is_enabled_by_default: boolean;
  default_channels?: ('email' | 'whatsapp')[];
}

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

const REMINDER_STATUS_OPTIONS = PAYMENT_STATUS_OPTIONS.filter(opt => 
  ['Unpaid', 'Overdue', 'Pending', 'In Process'].includes(opt.value)
);

const PROJECT_STATUS_OPTIONS = [
  { label: 'On Track', value: 'On Track' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
  { label: 'On Hold', value: 'On Hold' },
  { label: 'Planning', value: 'Planning' },
  { label: 'Pending', value: 'Pending' },
];

const NotificationPreferencesCard = () => {
  const { user, refreshUser } = useAuth();
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  const { data: notificationEvents = [], isLoading: isLoadingEvents } = useQuery<NotificationEvent[]>({
    queryKey: ['notification_events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('notification_events').select('*').order('category').order('label');
      if (error) throw error;
      return data;
    },
  });

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
    if (!user) return false;

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
    
    await refreshUser();
    return true;
  };

  const getEventDefaults = (typeId: string) => {
    const event = notificationEvents.find(e => e.id === typeId);
    return event?.default_channels || ['email', 'whatsapp'];
  };

  const getIsEnabled = (typeId: string) => {
    const pref = preferences[typeId];
    if (typeof pref === 'object' && pref !== null) {
      return pref.enabled !== false;
    }
    return pref !== false;
  };

  const getChannelEnabled = (typeId: string, channel: 'email' | 'whatsapp') => {
    const pref = preferences[typeId];

    if (typeof pref === 'object' && pref !== null && typeof pref[channel] === 'boolean') {
      return pref[channel];
    }

    const defaultChannels = getEventDefaults(typeId);
    return defaultChannels.includes(channel);
  };

  const handleChannelChange = async (typeId: string, channel: 'email' | 'whatsapp', isEnabled: boolean) => {
    const newPreferences = { ...preferences };
    const currentPref = newPreferences[typeId];

    if (typeof currentPref === 'object' && currentPref !== null) {
      newPreferences[typeId] = { ...currentPref, [channel]: isEnabled };
    } else {
      const defaultChannels = getEventDefaults(typeId);
      newPreferences[typeId] = { 
          enabled: true, 
          email: defaultChannels.includes('email'), 
          whatsapp: defaultChannels.includes('whatsapp'),
          [channel]: isEnabled
      };
    }

    const success = await updatePreferences(newPreferences);
    if (success) {
      toast.success("Notification channel updated.");
    }
  };

  const handleStatusChange = async (statusValue: string, isSelected: boolean) => {
    const currentPref = preferences.billing_reminder || {};
    const currentStatuses = currentPref.statuses || ['Overdue'];
    
    let newStatuses: string[];
    if (isSelected) {
      newStatuses = [...currentStatuses, statusValue];
    } else {
      newStatuses = currentStatuses.filter((s: string) => s !== statusValue);
    }

    const newPreferences = {
      ...preferences,
      billing_reminder: {
        ...currentPref,
        statuses: newStatuses,
      },
    };

    const success = await updatePreferences(newPreferences);
    if (success) {
      toast.success("Billing reminder statuses updated.");
    }
  };

  const handleProjectStatusChange = async (statusValue: string, isSelected: boolean) => {
    const currentPref = preferences.project_status_updated || {};
    const currentStatuses = currentPref.statuses || ['Completed'];
    
    let newStatuses: string[];
    if (isSelected) {
      newStatuses = [...currentStatuses, statusValue];
    } else {
      newStatuses = currentStatuses.filter((s: string) => s !== statusValue);
    }

    const newPreferences = {
      ...preferences,
      project_status_updated: {
        ...currentPref,
        statuses: newStatuses,
      },
    };

    const success = await updatePreferences(newPreferences);
    if (success) {
      toast.success("Project status reminder statuses updated.");
    }
  };

  const handleToneChange = async (toneValue: string) => {
    if (toneValue !== 'none') {
      const audio = new Audio(`${TONE_BASE_URL}${toneValue}`);
      audio.play().catch(e => console.error("Error playing audio preview:", e));
    }
    
    const newPreferences = { ...preferences, tone: toneValue };

    const success = await updatePreferences(newPreferences);
    if (success) {
      toast.success("Notification tone updated.");
    }
  };

  const handleGlobalToggle = async (key: 'toast_enabled', isEnabled: boolean) => {
    const newPreferences = { ...preferences, [key]: isEnabled };
    const success = await updatePreferences(newPreferences);
    if (success) {
      toast.success("Notification setting updated.");
    }
  };

  const groupedEvents = notificationEvents.reduce((acc, event) => {
    const category = event.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(event);
    return acc;
  }, {} as Record<string, NotificationEvent[]>);

  if (isLoading || isLoadingEvents) {
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
          <h3 className="text-lg font-semibold">Notification Types</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Notification</TableHead>
                  <TableHead className="text-center">In-App</TableHead>
                  <TableHead className="text-center">Email</TableHead>
                  <TableHead className="text-center">WhatsApp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedEvents).map(([category, events]) => (
                  <React.Fragment key={category}>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={4} className="font-semibold text-sm">{category}</TableCell>
                    </TableRow>
                    {events.map(type => {
                      const isEnabled = getIsEnabled(type.id);
                      const isBillingReminder = type.id === 'billing_reminder';
                      const selectedStatuses = preferences.billing_reminder?.statuses || ['Overdue'];
                      const isProjectStatusUpdate = type.id === 'project_status_updated';
                      const selectedProjectStatuses = preferences.project_status_updated?.statuses || ['Completed'];

                      return (
                        <React.Fragment key={type.id}>
                          <TableRow>
                            <TableCell>
                              <Label htmlFor={`notif-${type.id}`} className="font-medium">{type.label}</Label>
                              <p className="text-xs text-muted-foreground">{type.description}</p>
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                id={`notif-${type.id}`}
                                checked={isEnabled}
                                onCheckedChange={(checked) => {
                                  const newPreferences = { ...preferences };
                                  const currentPref = newPreferences[type.id];
                                  if (typeof currentPref === 'object' && currentPref !== null) {
                                    newPreferences[type.id] = { ...currentPref, enabled: checked };
                                  } else {
                                    newPreferences[type.id] = { enabled: checked, email: true, whatsapp: true };
                                  }
                                  updatePreferences(newPreferences).then(success => {
                                    if (success) toast.success("Notification setting updated.");
                                  });
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                id={`${type.id}-email`}
                                checked={getChannelEnabled(type.id, 'email')}
                                onCheckedChange={(checked) => handleChannelChange(type.id, 'email', !!checked)}
                                disabled={!isEnabled}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                id={`${type.id}-whatsapp`}
                                checked={getChannelEnabled(type.id, 'whatsapp')}
                                onCheckedChange={(checked) => handleChannelChange(type.id, 'whatsapp', !!checked)}
                                disabled={!isEnabled}
                              />
                            </TableCell>
                          </TableRow>
                          {isBillingReminder && isEnabled && (
                            <TableRow>
                              <TableCell colSpan={4} className="p-0">
                                <div className="p-4 pl-12 bg-muted/50">
                                  <Label className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Notify for statuses</Label>
                                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                                    {REMINDER_STATUS_OPTIONS.map(statusOption => (
                                      <div key={statusOption.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`status-${statusOption.value}`}
                                          checked={selectedStatuses.includes(statusOption.value)}
                                          onCheckedChange={(checked) => handleStatusChange(statusOption.value, !!checked)}
                                        />
                                        <Label htmlFor={`status-${statusOption.value}`} className="text-sm font-normal">
                                          {statusOption.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          {isProjectStatusUpdate && isEnabled && (
                            <TableRow>
                              <TableCell colSpan={4} className="p-0">
                                <div className="p-4 pl-12 bg-muted/50">
                                  <Label className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Notify for statuses</Label>
                                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                                    {PROJECT_STATUS_OPTIONS.map(statusOption => (
                                      <div key={statusOption.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`project-status-${statusOption.value}`}
                                          checked={selectedProjectStatuses.includes(statusOption.value)}
                                          onCheckedChange={(checked) => handleProjectStatusChange(statusOption.value, !!checked)}
                                        />
                                        <Label htmlFor={`project-status-${statusOption.value}`} className="text-sm font-normal">
                                          {statusOption.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesCard;