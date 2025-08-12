import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const IntegrationsPage = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>Connect your favorite apps to supercharge your workflow.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
                <h3 className="font-semibold">Google Calendar</h3>
                <p className="text-sm text-muted-foreground">Sync your calendar events to create projects.</p>
            </div>
            <Button asChild>
                <Link to="/settings/integrations/google-calendar">Manage</Link>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntegrationsPage;