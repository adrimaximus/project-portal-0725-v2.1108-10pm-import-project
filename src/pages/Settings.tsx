import PortalLayout from "@/components/PortalLayout";
import FeatureCard from "@/components/settings/FeatureCard";
import { useFeatures } from "@/contexts/FeaturesContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Wand2 } from "lucide-react";

const SettingsPage = () => {
  const { features } = useFeatures();

  return (
    <PortalLayout>
      <TooltipProvider>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 border rounded-lg bg-muted">
                <Wand2 className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Enabled Features</h1>
            </div>
            <p className="text-muted-foreground">
              Enable or disable features available in your plan. Disabled features will be hidden from the sidebar.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((feature) => (
                <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </div>
      </TooltipProvider>
    </PortalLayout>
  );
};

export default SettingsPage;