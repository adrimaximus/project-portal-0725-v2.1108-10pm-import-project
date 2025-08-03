import PortalLayout from "@/components/PortalLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const DashboardPage = () => {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's a summary of your workspace.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Active Projects</CardTitle>
              <CardDescription>3 projects are currently in progress.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">3</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Goals</CardTitle>
              <CardDescription>You are tracking 3 goals this quarter.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">3</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>5 members are active in your team.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">5</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default DashboardPage;