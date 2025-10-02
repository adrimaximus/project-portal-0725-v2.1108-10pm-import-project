import { useNotifications } from "@/hooks/useNotifications";
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getNotificationIcon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const NotificationsPage = () => {
  const { 
    notifications, 
    isLoading, 
    error, 
    markAllAsRead, 
    isMarkingAllRead,
    unreadCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useNotifications();

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <Button 
            onClick={() => markAllAsRead()} 
            disabled={isMarkingAllRead || unreadCount === 0}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </div>

        {isLoading && <p>Loading notifications...</p>}
        {error && <p className="text-destructive">Error loading notifications: {error.message}</p>}
        
        <div className="border rounded-lg overflow-hidden">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map(notification => {
                const Icon = getNotificationIcon(notification.type);
                return (
                  <div 
                    key={notification.id} 
                    className={cn(
                      "flex items-start gap-4 p-4 transition-colors",
                      !notification.read_at && "bg-muted/50"
                    )}
                  >
                    <div className="relative">
                      <Icon className="h-6 w-6 text-muted-foreground mt-1" />
                      {!notification.read_at && (
                        <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Link to={notification.data.link || "#"} className="hover:underline">
                        <p className="font-semibold">{notification.title}</p>
                      </Link>
                      <p className="text-sm text-muted-foreground">{notification.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: id })}
                      </p>
                    </div>
                    {notification.read_at ? (
                      <Button variant="ghost" size="sm" className="text-muted-foreground" disabled>Read</Button>
                    ) : (
                      <Button variant="outline" size="sm">Mark as read</Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="p-8 text-center text-muted-foreground">You have no notifications.</p>
          )}
        </div>
        {hasNextPage && (
          <div className="mt-6 text-center">
            <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'Loading more...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default NotificationsPage;