import PortalLayout from "@/components/PortalLayout";
import FeatureCard from "@/components/settings/FeatureCard";
import IntegrationCard from "@/components/settings/IntegrationCard";
import NavigationCard from "@/components/settings/NavigationCard";
import { useFeatures } from "@/contexts/FeaturesContext";

const SettingsPage = () => {
  const { features } = useFeatures();

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and feature preferences.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          <IntegrationCard />
          <NavigationCard />
        </div>
      </div>
    </PortalLayout>
  );
};

export default SettingsPage;