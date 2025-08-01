import PortalLayout from "@/components/PortalLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const MoodTracker = () => {
  return (
    <PortalLayout>
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Mood Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the mood tracker page.</p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default MoodTracker;