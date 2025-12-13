import PortalLayout from "@/components/PortalLayout";
import IntegrationCard from "@/components/settings/IntegrationCard";
import NavigationCard from "@/components/settings/NavigationCard";
import TeamCard from "@/components/settings/TeamCard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useFeatures } from "@/contexts/FeaturesContext";
import TagsCard from "@/components/settings/TagsCard";
import ThemeCard from "@/components/settings/ThemeCard";
import ServicesCard from "@/components/settings/ServicesCard";
import NotificationsCard from "@/components/settings/NotificationsCard";
import PropertiesCard from "@/components/settings/PropertiesCard";
import BankAccountsCard from "@/components/settings/BankAccountsCard";

const WorkspaceSettingsCard = () => {
  const navigate = useNavigate();
  return (
    <Card onClick={() => navigate('/settings/workspace')} className="cursor-pointer hover:bg-muted/50 transition-colors h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Workspace Settings</CardTitle>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Manage global features and settings for the entire workspace.
        </p>
      </CardContent>
    </Card>
  );
};

const Settings = () => {
  const { user, hasPermission } = useAuth();
  const { isFeatureEnabled } = useFeatures();
  const isMasterAdmin = user?.role === 'master admin';
  const isAdmin = isMasterAdmin || user?.role === 'admin';

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
          {/* Available to all members */}
          <NavigationCard />
          <TagsCard />
          <ThemeCard />
          <NotificationsCard />
          
          {/* Conditionally available */}
          {isFeatureEnabled('integrations') && hasPermission('settings:manage_integrations') && <IntegrationCard />}
          
          {/* Role-based */}
          {isAdmin && (
            <>
              <TeamCard />
              <ServicesCard />
              <PropertiesCard />
              <BankAccountsCard />
            </>
          )}
          {isMasterAdmin && <WorkspaceSettingsCard />}
        </div>
      </div>
    </PortalLayout>
  );
};

export default Settings;