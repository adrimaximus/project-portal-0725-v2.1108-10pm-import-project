import PortalLayout from "@/components/PortalLayout";
import { Link } from "react-router-dom";

const SettingsPage = () => {
  return (
    <PortalLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Select a setting to manage.</p>
        <div className="mt-4">
          <Link to="/settings/properties" className="text-blue-600 hover:underline">Custom Properties</Link>
        </div>
      </div>
    </PortalLayout>
  );
};

export default SettingsPage;