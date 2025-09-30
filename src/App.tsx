import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import IntegrationsPage from './pages/IntegrationsPage';
import GoogleCalendarIntegrationPage from './pages/GoogleCalendarIntegrationPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/settings/integrations" replace />} />
        <Route path="/settings" element={<Navigate to="/settings/integrations" replace />} />
        <Route path="/settings/integrations" element={<IntegrationsPage />} />
        <Route path="/settings/integrations/google-calendar" element={<GoogleCalendarIntegrationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;