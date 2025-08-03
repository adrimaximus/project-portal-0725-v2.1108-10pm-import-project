import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feature } from "@/data/features";
import { useFeatures } from "@/contexts/FeaturesContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

interface FeatureCardProps {
  feature: Feature;
}

const FeatureCard = ({ feature }: FeatureCardProps) => {
  const { toggleFeatureStatus } = useFeatures();
  const navigate = useNavigate();
  const isSettingsFeature = feature.id === 'settings';
  const isEnabled = feature.status === 'enabled';

  const handleAdvancedSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/settings/${feature.id}`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{feature.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => toggleFeatureStatus(feature.id)}
            disabled={isSettingsFeature}
            variant={isEnabled ? "outline" : "default"}
            size="sm"
            className={cn(
              "capitalize w-[80px]",
              isEnabled && "border-green-500 text-green-500 hover:bg-green-50/50 hover:text-green-600",
              isSettingsFeature && "cursor-not-allowed opacity-50"
            )}
          >
            {feature.status}
          </Button>
          {!isSettingsFeature && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleAdvancedSettingsClick}>
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="sr-only">Advanced Settings</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Advanced Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{feature.description}</p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;