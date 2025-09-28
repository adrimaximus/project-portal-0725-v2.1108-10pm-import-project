import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ChevronRight, HardDrive } from "lucide-react";

const StorageCard = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/settings/storage');
  };

  return (
    <Card onClick={handleClick} className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          Storage Management
        </CardTitle>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Manage your local storage data and preferences.
        </p>
      </CardContent>
    </Card>
  );
};

export default StorageCard;