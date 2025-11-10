import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PropertiesSettingsPage from "./pages/PropertiesSettingsPage";
import BillingPropertiesPage from "./pages/BillingPropertiesPage";
import CompanyPropertiesPage from "./pages/CompanyPropertiesPage";
import ProjectPropertiesPage from "./pages/ProjectPropertiesPage";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Other routes might be here */}
          <Route path="/settings/properties" element={<PropertiesSettingsPage />} />
          <Route path="/settings/company-properties" element={<CompanyPropertiesPage />} />
          <Route path="/settings/project-properties" element={<ProjectPropertiesPage />} />
          <Route path="/settings/billing-properties" element={<BillingPropertiesPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;