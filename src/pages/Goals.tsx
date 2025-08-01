import PortalLayout from "@/components/PortalLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Goals = () => {
  return (
    <PortalLayout>
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the goals page.</p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Goals;