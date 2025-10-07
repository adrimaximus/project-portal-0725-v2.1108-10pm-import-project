import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const ThemeCard = () => {
  const navigate = useNavigate();
  return (
    <Card onClick={() => navigate('/settings/theme')} className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Theme</CardTitle>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Sesuaikan tampilan dan nuansa aplikasi.
        </p>
      </CardContent>
    </Card>
  );
};

export default ThemeCard;