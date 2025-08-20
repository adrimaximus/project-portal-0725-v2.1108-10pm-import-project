import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDemo } from "@/contexts/DemoContext";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const DemoModeCard = () => {
  const { isDemoMode, setDemoMode, isLoading: isContextLoading } = useDemo();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    try {
      await setDemoMode(checked);
    } catch (error) {
      // The error toast is already shown in the context
      console.error("Failed to toggle demo mode:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isDisabled = isContextLoading || isUpdating;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Demo Mode</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="demo-mode-switch" className="flex flex-col space-y-1">
            <span className="font-medium">Activate Demo Mode</span>
            <span className="text-xs font-normal leading-snug text-muted-foreground">
              Hide or blur sensitive financial data for presentations.
            </span>
          </Label>
          <div className="flex items-center gap-2">
            {isDisabled && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="demo-mode-switch"
              checked={isDemoMode}
              onCheckedChange={handleToggle}
              disabled={isDisabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemoModeCard;