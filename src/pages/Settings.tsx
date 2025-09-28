import PortalLayout from "@/components/PortalLayout";
import FeatureCard from "@/components/settings/FeatureCard";
import IntegrationCard from "@/components/settings/IntegrationCard";
import NavigationCard from "@/components/settings/NavigationCard";
import TeamCard from "@/components/settings/TeamCard";
import StorageCard from "@/components/settings/StorageCard";
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
            .filter(f => f.id !== 'user-management')
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((feature) => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          <TeamCard />
          <IntegrationCard />
          <NavigationCard />
          <StorageCard />
        </div>
      </div>
    </PortalLayout>
  );
};

export default SettingsPage;