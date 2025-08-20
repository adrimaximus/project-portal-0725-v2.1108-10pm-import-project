import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/contexts/DemoContext";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const DemoModeCard = () => {
  const { isDemoMode, setDemoMode, isLoading: isContextLoading } = useDemo();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await setDemoMode(!isDemoMode);
    } catch (error) {
      console.error("Failed to toggle demo mode:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isDisabled = isContextLoading || isUpdating;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Demo Mode</CardTitle>
        <div className="flex items-center gap-2">
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Button
            onClick={handleToggle}
            disabled={isDisabled}
            variant={isDemoMode ? "outline" : "default"}
            size="sm"
            className={cn(
              "capitalize w-[80px]",
              isDemoMode && "border-green-500 text-green-500 hover:bg-green-50/50 hover:text-green-600"
            )}
          >
            {isDemoMode ? 'Enabled' : 'Disabled'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Hide or blur sensitive financial data for presentations.
        </p>
      </CardContent>
    </Card>
  );
};

export default DemoModeCard;