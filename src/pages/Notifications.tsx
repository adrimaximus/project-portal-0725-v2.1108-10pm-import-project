import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

const Notifications = () => {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Bell className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Manage your notification settings and view recent updates.
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-12">
              <Bell className="mx-auto h-12 w-12" />
              <p className="mt-4">You have no new notifications.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Notifications;