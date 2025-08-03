import PortalLayout from "@/components/PortalLayout";
import { Link } from "react-router-dom";

const SettingsPage = () => {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and application settings.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/settings/team" className="block p-4 border rounded-lg hover:bg-muted">
                <h3 className="font-semibold">Team Members & Access</h3>
                <p className="text-sm text-muted-foreground">Manage team members and roles.</p>
            </Link>
            <Link to="/settings/integrations" className="block p-4 border rounded-lg hover:bg-muted">
                <h3 className="font-semibold">Integrations</h3>
                <p className="text-sm text-muted-foreground">Connect third-party apps.</p>
            </Link>
        </div>
      </div>
    </PortalLayout>
  );
};

export default SettingsPage;