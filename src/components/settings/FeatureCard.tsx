import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureFlag } from "@/contexts/FeaturesContext";
import { useFeatures } from "@/contexts/FeaturesContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  feature: FeatureFlag;
}

const FeatureCard = ({ feature }: FeatureCardProps) => {
  const { toggleFeatureStatus } = useFeatures();
  const isCoreFeature = feature.id === 'settings' || feature.id === 'dashboard';
  const isEnabled = feature.is_enabled;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{feature.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => toggleFeatureStatus(feature.id, feature.is_enabled)}
            disabled={isCoreFeature}
            variant={isEnabled ? "outline" : "default"}
            size="sm"
            className={cn(
              "capitalize w-[80px]",
              isEnabled && "border-green-500 text-green-500 hover:bg-green-50/50 hover:text-green-600",
              isCoreFeature && "cursor-not-allowed opacity-50"
            )}
          >
            {isEnabled ? 'enabled' : 'disabled'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{feature.description}</p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;