import PortalLayout from "@/components/PortalLayout";
import { Link } from "react-router-dom";

const IntegrationsPage = () => {
  return (
    <PortalLayout>
      <h1 className="text-2xl font-bold">Integrations</h1>
      <Link to="/settings/integrations/google-calendar">Go to Google Calendar</Link>
    </PortalLayout>
  );
};

export default IntegrationsPage;