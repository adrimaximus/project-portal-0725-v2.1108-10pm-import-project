import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import IntegrationsPage from "./pages/IntegrationsPage";
import GoogleCalendarIntegrationPage from "./pages/GoogleCalendarIntegrationPage";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/settings/integrations" element={<IntegrationsPage />} />
        <Route path="/settings/integrations/google-calendar" element={<GoogleCalendarIntegrationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;