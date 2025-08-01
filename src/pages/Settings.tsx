import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/contexts/UserContext";

const Settings = () => {
  const { user } = useUser();

  return (
    <PortalLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              This is how others will see you on the site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <img
                alt="User avatar"
                className="rounded-full"
                height="96"
                src={user.avatar}
                style={{
                  aspectRatio: "96/96",
                  objectFit: "cover",
                }}
                width="96"
              />
              <div className="space-y-1">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Settings;