import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { dummyNotifications, Notification } from "@/data/notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const NotificationItem = ({ notification, isLast }: { notification: Notification, isLast: boolean }) => {
  const Icon = notification.icon;
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border z-10">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        {!isLast && <div className="w-px h-full bg-border" />}
      </div>
      <div className="flex-1 pb-8 pt-1">
        <div className="flex justify-between">
            <p className={cn("font-medium", !notification.read && "font-bold")}>{notification.title}</p>
            {!notification.read && (
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
            )}
        </div>
        <p className="text-sm text-muted-foreground">{notification.description}</p>
        <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
      </div>
    </div>
  );
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(dummyNotifications);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>You have {unreadCount} unread message{unreadCount !== 1 && 's'}.</CardDescription>
            </div>
            <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>Mark all as read</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div>
            {notifications.map((notification, index) => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
                isLast={index === notifications.length - 1}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;