import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Goals = () => {
  return (
    <PortalLayout>
      <div className="p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the goals page. Goal tracking functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Goals;