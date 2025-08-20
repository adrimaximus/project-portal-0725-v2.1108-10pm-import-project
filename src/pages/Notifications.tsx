import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notificationIcons } from "@/data/notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { Notification } from "@/types";

const NotificationsPage = () => {
  const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const prevNotificationsRef = useRef<Notification[]>([]);

  useEffect(() => {
    if (notifications.length > 0 && prevNotificationsRef.current.length > 0 && notifications[0].id !== prevNotificationsRef.current[0].id) {
      setHighlightedId(notifications[0].id);
      const timer = setTimeout(() => {
        setHighlightedId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
    prevNotificationsRef.current = notifications;
  }, [notifications]);

  if (isLoading) {
    return (
      <PortalLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Bell className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                <Skeleton className="h-5 w-48 mt-1" />
              </div>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4">
                    <Skeleton className="h-6 w-6 rounded-full mt-1" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Bell className="h-8 w-8" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                You have {unreadCount} unread notifications.
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button onClick={() => markAllAsRead()} variant="outline" size="sm">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || notificationIcons.system;
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 sm:gap-4 p-3 sm:p-4 transition-colors duration-1000 ease-out",
                      !notification.read_at && "bg-muted/50",
                      highlightedId === notification.id && "bg-accent"
                    )}
                  >
                    <div className="relative">
                      <Icon className="h-6 w-6 text-muted-foreground mt-1" />
                      {!notification.read_at && (
                        <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={notification.link || "#"} className="hover:underline" onClick={() => !notification.read_at && markAsRead(notification.id)}>
                        <p className="font-semibold">{notification.title}</p>
                      </Link>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: id })}
                      </p>
                    </div>
                    {!notification.read_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs px-2 h-auto py-1 self-center"
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            {notifications.length === 0 && (
              <div className="text-center text-muted-foreground p-12">
                <Bell className="mx-auto h-12 w-12" />
                <p className="mt-4">You have no notifications.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default NotificationsPage;