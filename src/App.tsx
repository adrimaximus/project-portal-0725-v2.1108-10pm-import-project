import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FeaturesProvider } from "@/contexts/FeaturesContext";
import FeatureSettingsPage from "@/pages/FeatureSettingsPage";
import Index from "@/pages/Index";
import SettingsPage from "@/pages/Settings";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import IntegrationsPage from "./pages/IntegrationsPage";

function App() {
  return (
    <FeaturesProvider>
      <TooltipProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route
              path="/settings/features/:featureId"
              element={<FeatureSettingsPage />}
            />
            <Route path="/settings/integrations" element={<IntegrationsPage />} />
          </Routes>
        </Router>
        <Toaster />
      </TooltipProvider>
    </FeaturesProvider>
  );
}

export default App;