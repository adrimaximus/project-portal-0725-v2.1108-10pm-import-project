import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PropertiesSettingsPage from './pages/PropertiesSettingsPage';
import BillingPropertiesPage from './pages/BillingPropertiesPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/settings/properties" />} />
        <Route path="/settings" element={<Navigate to="/settings/properties" />} />
        <Route path="/settings/properties" element={<PropertiesSettingsPage />} />
        <Route path="/settings/billing-properties" element={<BillingPropertiesPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;