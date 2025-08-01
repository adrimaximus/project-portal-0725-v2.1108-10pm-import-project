import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dummyNotifications, Notification } from "@/data/notifications";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

const NotificationsPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifikasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dummyNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const renderMessage = (message: string) => {
    const parts = message.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg border transition-colors",
        !notification.read ? "bg-muted/50" : "bg-transparent"
      )}
    >
      <Avatar className="h-10 w-10 border">
        <AvatarImage src={notification.user.avatar} alt={notification.user.name} />
        <AvatarFallback>{notification.user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-semibold">{notification.user.name}</span>{' '}
          {renderMessage(notification.message)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
      </div>
      {!notification.read && (
        <div className="h-2.5 w-2.5 rounded-full bg-primary self-center" />
      )}
    </div>
  );
};

export default NotificationsPage;