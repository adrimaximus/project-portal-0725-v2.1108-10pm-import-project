import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feature } from "@/data/features";
import { useFeatures } from "@/contexts/FeaturesContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FeatureCardProps {
  feature: Feature;
}

const FeatureCard = ({ feature }: FeatureCardProps) => {
  const { toggleFeatureStatus } = useFeatures();
  const isSettingsFeature = feature.id === 'settings';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{feature.name}</CardTitle>
        <div className="flex items-center space-x-2">
          <Switch
            id={`feature-switch-${feature.id}`}
            checked={feature.status === 'enabled'}
            onCheckedChange={() => toggleFeatureStatus(feature.id)}
            disabled={isSettingsFeature}
            aria-label={`Toggle ${feature.name} feature`}
          />
          <Label htmlFor={`feature-switch-${feature.id}`} className="text-sm text-muted-foreground">
            {feature.status === 'enabled' ? 'Enabled' : 'Upgrade'}
          </Label>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{feature.description}</p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;