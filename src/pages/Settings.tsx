import PortalLayout from "@/components/PortalLayout";
import FeatureCard from "@/components/settings/FeatureCard";
import { features } from "@/data/features";
import { Wand2 } from "lucide-react";

const SettingsPage = () => {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 border rounded-lg bg-muted">
              <Wand2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Enabled Features</h1>
          </div>
          <p className="text-muted-foreground">
            The following features are currently enabled as part of your platform plan.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.sort((a, b) => (a.status === 'enabled' ? -1 : 1)).map((feature) => (
            <FeatureCard key={feature.name} feature={feature} />
          ))}
        </div>
      </div>
    </PortalLayout>
  );
};

export default SettingsPage;