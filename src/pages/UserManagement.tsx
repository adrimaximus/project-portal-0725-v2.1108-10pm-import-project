import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

const UserManagementPage = () => {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Here you can manage all the users in your workspace.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12">
              <Users className="h-12 w-12 mb-4" />
              <p className="text-lg font-semibold">User list will be displayed here.</p>
              <p>This feature is currently under development.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default UserManagementPage;