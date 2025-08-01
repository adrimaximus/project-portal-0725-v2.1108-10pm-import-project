import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Notifications = () => {
  return (
    <PortalLayout>
      <div className="p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the notifications page. Your notifications will appear here.</p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Notifications;