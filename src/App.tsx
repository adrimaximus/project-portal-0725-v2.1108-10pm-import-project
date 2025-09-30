import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import IntegrationsPage from "./pages/IntegrationsPage";
import GoogleCalendarIntegrationPage from "./pages/GoogleCalendarIntegrationPage";
import PortalLayout from "./components/PortalLayout";

// Placeholder components for other routes to make the app buildable
const SettingsPage = () => (
    <PortalLayout>
        <div className="p-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p>This is a placeholder for the settings page.</p>
        </div>
    </PortalLayout>
);

const GoogleDrivePage = () => (
    <PortalLayout>
        <div className="p-6">
            <h1 className="text-2xl font-bold">Google Drive Integration</h1>
        </div>
    </PortalLayout>
);

const OpenAiPage = () => (
    <PortalLayout>
        <div className="p-6">
            <h1 className="text-2xl font-bold">OpenAI Integration</h1>
        </div>
    </PortalLayout>
);

const WbiztoolPage = () => (
    <PortalLayout>
        <div className="p-6">
            <h1 className="text-2xl font-bold">WBIZTOOL Integration</h1>
        </div>
    </PortalLayout>
);

const IndexPage = () => (
    <PortalLayout>
        <div className="p-6">
            <h1 className="text-2xl font-bold">Home</h1>
            <Link to="/settings/integrations">Go to Integrations</Link>
        </div>
    </PortalLayout>
);


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/integrations" element={<IntegrationsPage />} />
        <Route path="/settings/integrations/google-calendar" element={<GoogleCalendarIntegrationPage />} />
        <Route path="/settings/integrations/google-drive" element={<GoogleDrivePage />} />
        <Route path="/settings/integrations/openai" element={<OpenAiPage />} />
        <Route path="/settings/integrations/wbiztool" element={<WbiztoolPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;