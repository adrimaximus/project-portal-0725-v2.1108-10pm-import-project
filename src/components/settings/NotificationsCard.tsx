import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotificationsCard = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/settings/notifications');
  };

  return (
    <Card onClick={handleClick} className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </CardTitle>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Configure how you receive alerts and updates.
        </p>
      </CardContent>
    </Card>
  );
};

export default NotificationsCard;