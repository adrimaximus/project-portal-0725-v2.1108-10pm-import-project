import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionContextProvider } from "@/contexts/SessionContext";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import PropertiesSettingsPage from "./pages/PropertiesSettingsPage";
import ProjectStatusesPage from "./pages/settings/ProjectStatusesPage";
import PaymentStatusesPage from "./pages/settings/PaymentStatusesPage";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

function App() {
  return (
    <SessionContextProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/properties" element={<PropertiesSettingsPage />} />
              <Route path="/settings/project-statuses" element={<ProjectStatusesPage />} />
              <Route path="/settings/payment-statuses" element={<PaymentStatusesPage />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </SessionContextProvider>
  );
}

export default App;