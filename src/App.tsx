import { Routes, Route, Navigate } from "react-router-dom";
import IntegrationsPage from "./pages/IntegrationsPage";
import GoogleCalendarIntegrationPage from "./pages/GoogleCalendarIntegrationPage";
import GoogleDriveIntegrationPage from "./pages/GoogleDriveIntegrationPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/settings/integrations" />} />
      <Route path="/settings/integrations" element={<IntegrationsPage />} />
      <Route
        path="/settings/integrations/google-calendar"
        element={<GoogleCalendarIntegrationPage />}
      />
      <Route
        path="/settings/integrations/google-drive"
        element={<GoogleDriveIntegrationPage />}
      />
    </Routes>
  );
}

export default App;