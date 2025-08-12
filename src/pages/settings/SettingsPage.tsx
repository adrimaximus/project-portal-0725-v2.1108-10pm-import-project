import PortalLayout from "@/components/PortalLayout";
import { Link } from "react-router-dom";

const SettingsPage = () => {
  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold">Settings</h1>
      <Link to="/settings/integrations" className="text-blue-500 hover:underline">Go to Integrations</Link>
    </PortalLayout>
  );
};

export default SettingsPage;