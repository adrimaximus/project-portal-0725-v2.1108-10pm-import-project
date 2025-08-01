import PortalLayout from "@/components/PortalLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Index = () => {
  return (
    <PortalLayout>
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Welcome to your dashboard.</p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Index;