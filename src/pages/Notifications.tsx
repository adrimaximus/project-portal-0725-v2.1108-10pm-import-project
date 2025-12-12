import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { notificationIcons } from "@/data/notifications";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import InteractiveText from "@/components/InteractiveText";
import { useProfiles } from "@/hooks/useProfiles";
import { cn } from "@/lib/utils";
import PortalSidebar from "@/components/PortalSidebar";
import PortalHeader from "@/components/PortalHeader";

// Helper function to parse JSON in notifications (specifically for venue/maps)
const formatNotificationText = (text: string) => {
  if (!text) return "";
  
  // Detect venue update which often contains JSON data
  if (text.includes("updated the venue to")) {
    try {
      const parts = text.split("updated the venue to");
      if (parts.length >= 2) {
        let jsonPart = parts.slice(1).join("updated the venue to").trim();
        
        // Remove surrounding quotes if they exist
        if ((jsonPart.startsWith('"') && jsonPart.endsWith('"')) || 
            (jsonPart.startsWith("'") && jsonPart.endsWith("'"))) {
          jsonPart = jsonPart.slice(1, -1);
        }
        
        // Handle escaped quotes
        if (jsonPart.includes('\\"')) {
            jsonPart = jsonPart.replace(/\\"/g, '"');
        }

        // Only parse if it looks like an object
        if (jsonPart.trim().startsWith('{')) {
            const parsed = JSON.parse(jsonPart);
            // Prioritize address, then name
            const locationName = parsed.address || parsed.name;
            if (locationName) {
              return `${parts[0]}updated the venue to "${locationName}"`;
            }
        }
      }
    } catch (e) {
      // Fallback to original text on error
    }
  }
  
  return text;
};

const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const { data: allUsers = [] } = useProfiles();

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <PortalSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <PortalHeader summary={<h1 className="text-lg font-semibold md:text-xl">Notifications</h1>} />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="container mx-auto max-w-4xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">All Notifications</h2>
              {notifications.some(n => !n.read) && (
                <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark all as read
                </Button>
              )}
            </div>

            <div className="grid gap-4">
              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <p>You have no notifications</p>
                  </CardContent>
                </Card>
              ) : (
                notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || notificationIcons.system;
                  
                  return (
                    <Card 
                      key={notification.id} 
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/50",
                        !notification.read && "bg-muted/20 border-l-4 border-l-primary"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4 flex gap-4">
                        <div className={cn(
                          "p-2 rounded-full h-fit", 
                          !notification.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-sm">
                              <InteractiveText text={notification.title} members={allUsers} />
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: id })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            <InteractiveText text={formatNotificationText(notification.description)} members={allUsers} />
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Notifications;