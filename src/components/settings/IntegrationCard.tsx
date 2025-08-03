import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Puzzle } from "lucide-react";
import { Link } from "react-router-dom";

const IntegrationCard = () => {
  return (
    <Link to="/settings/integrations" className="block">
      <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all duration-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Integrations</CardTitle>
            <Puzzle className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect and manage your third-party application integrations.
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default IntegrationCard;