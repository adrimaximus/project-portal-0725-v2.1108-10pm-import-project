import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { dummyNotifications, Notification } from "@/data/notifications";
import { cn } from "@/lib/utils";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(dummyNotifications);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              You have {unreadCount} unread messages.
            </CardDescription>
          </div>
          <Button size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {notifications.map((notification: Notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 p-4 transition-colors",
                  !notification.read && "bg-muted/50"
                )}
              >
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={notification.avatar} alt={notification.name} />
                  <AvatarFallback>{notification.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1 flex-1">
                  <p className="text-sm font-medium leading-snug">
                    <span className="font-semibold">{notification.name}</span>{" "}
                    {notification.action}{" "}
                    <span className="font-semibold text-primary">{notification.target}</span>.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {notification.time}
                  </p>
                </div>
                {!notification.read && (
                  <div className="h-2.5 w-2.5 self-center rounded-full bg-primary" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;