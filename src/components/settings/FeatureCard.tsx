import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feature } from "@/data/features";
import { Check, Lock } from "lucide-react";

interface FeatureCardProps {
  feature: Feature;
}

const FeatureCard = ({ feature }: FeatureCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">{feature.name}</CardTitle>
        {feature.status === 'enabled' ? (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
            <Check className="mr-1 h-3 w-3" />
            Enabled
          </Badge>
        ) : (
          <Button variant="outline" size="sm" className="shrink-0">
            <Lock className="mr-2 h-4 w-4" />
            Upgrade
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{feature.description}</p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;