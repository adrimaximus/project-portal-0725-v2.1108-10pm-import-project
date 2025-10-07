import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ThemeCard = () => {
  const navigate = useNavigate();
  return (
    <Card onClick={() => navigate('/settings/theme')} className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Theme</CardTitle>
        <Palette className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Customize the look and feel of your workspace.
        </p>
      </CardContent>
    </Card>
  );
};

export default ThemeCard;