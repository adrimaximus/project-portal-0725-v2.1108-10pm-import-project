import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notificationIcons } from "@/data/notifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { Link } from "react-router-dom";
import { Bell, CheckCheck, Loader2, AlertTriangle, CheckCircle, Circle } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Skeleton } from "@/components/ui/skeleton";
import InteractiveText from "@/components/InteractiveText";
import { useProfiles } from "@/hooks/useProfiles";

const NotificationSkeleton = () => (
  <div className="flex items-start gap-4 p-4">
    <Skeleton className="h-6 w-6 rounded-full mt-1" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  </div>
);

const NotificationsPage = () => {
  const { 
    notifications, 
    isLoading, 
    error,
    unreadCount, 
    markAsRead,
    markAsUnread,
    markAllAsRead,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();
  const { data: allUsers = [] } = useProfiles();

  if (error) {
    return (
      <PortalLayout>
        <div className="flex flex-col items-center justify-center h-full text-center text-destructive p-8">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <h2 className="text-2xl font-bold">Error Loading Notifications</h2>
          <p className="mt-2 max-w-md">{error.message}</p>
          <p className="mt-4 text-sm text-muted-foreground">There might be an issue with the database connection or a recent change. Please try again later or contact support.</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Bell className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">
                You have {unreadCount} unread notifications.
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button onClick={() => markAllAsRead()} variant="outline">
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <NotificationSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || notificationIcons.system;
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-4 p-4 transition-colors",
                        !notification.read && "bg-muted/50"
                      )}
                    >
                      <div className="relative">
                        <Icon className="h-6 w-6 text-muted-foreground mt-1" />
                        {!notification.read && (
                          <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Link to={notification.link || "#"} className="hover:underline">
                          <p className="font-semibold"><InteractiveText text={notification.title} members={allUsers} /></p>
                        </Link>
                        <p className="text-sm text-muted-foreground"><InteractiveText text={notification.description} members={allUsers} /></p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.timestamp ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true }) : ''}
                        </p>
                      </div>
                      {notification.read ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => markAsUnread(notification.id)}
                          title="Mark as unread"
                        >
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Circle className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {!isLoading && notifications.length === 0 && (
              <div className="text-center text-muted-foreground p-12">
                <Bell className="mx-auto h-12 w-12" />
                <p className="mt-4">You have no notifications.</p>
              </div>
            )}
            {hasNextPage && (
              <div className="p-4 text-center">
                <Button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  variant="outline"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Load More
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default NotificationsPage;