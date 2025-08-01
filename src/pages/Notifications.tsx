import { Bell, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const notifications = [
  {
    id: 1,
    title: "New project assigned",
    description: "You have been assigned to the 'New Marketing Website' project.",
    time: "15 minutes ago",
    read: false,
  },
  {
    id: 2,
    title: "Payment received",
    description: "Payment for invoice #INV-001 has been received.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    title: "Team member added",
    description: "John Doe has been added to your team.",
    time: "3 hours ago",
    read: false,
  },
  {
    id: 4,
    title: "Project deadline approaching",
    description: "The 'Q3 Report' project is due in 3 days.",
    time: "1 day ago",
    read: true,
  },
];

const NotificationsPage = () => {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>You have {notifications.filter(n => !n.read).length} unread messages.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-end gap-2 mb-4">
            <Button variant="outline" size="sm">Mark all as read</Button>
          </div>
          <ul className="divide-y divide-border border rounded-lg overflow-hidden">
            {notifications.map((notification) => (
              <li key={notification.id} className={`flex items-start gap-4 p-4 transition-colors ${!notification.read ? 'bg-muted/50' : 'bg-background'}`}>
                <div className="flex-shrink-0 pt-1">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${notification.read ? 'bg-gray-100 dark:bg-gray-800' : 'bg-primary/10'}`}>
                    <Bell className={`h-4 w-4 ${notification.read ? 'text-muted-foreground' : 'text-primary'}`} />
                  </span>
                </div>
                <div className="flex-grow">
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                </div>
                {!notification.read && (
                  <div className="flex-shrink-0 self-center">
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" title="Mark as read">
                        <CheckCircle className="h-5 w-5 text-muted-foreground hover:text-green-500 transition-colors" />
                        <span className="sr-only">Mark as read</span>
                     </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;