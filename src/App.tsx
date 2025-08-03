import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FeaturesProvider } from "./contexts/FeaturesContext";
import { Toaster } from "@/components/ui/sonner";

import IndexPage from "./pages/Index";
import SettingsPage from "./pages/SettingsPage";
import TeamSettingsPage from "./pages/TeamSettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import OpenAiIntegrationPage from "./pages/integrations/OpenAiIntegrationPage";

function App() {
  return (
    <FeaturesProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/team" element={<TeamSettingsPage />} />
          <Route path="/settings/integrations" element={<IntegrationsPage />} />
          <Route path="/settings/integrations/openai" element={<OpenAiIntegrationPage />} />
          
          {/* Redirect to a default page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </FeaturesProvider>
  );
}

export default App;