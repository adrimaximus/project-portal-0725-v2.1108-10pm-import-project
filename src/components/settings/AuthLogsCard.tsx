import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const AuthLogsCard = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/settings/auth-logs');
  };

  return (
    <Card onClick={handleClick} className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Authentication Logs</CardTitle>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Monitor login attempts and authentication events.
        </p>
      </CardContent>
    </Card>
  );
};

export default AuthLogsCard;