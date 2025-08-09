import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from "@/components/ui/sonner"

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProjectPage from './pages/ProjectPage';
import SettingsPage from './pages/SettingsPage';
// import ProtectedRoute from './components/auth/ProtectedRoute';
import Onboarding from './pages/Onboarding';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<Onboarding />} />
          
          {/* Rute yang dilindungi dinonaktifkan sementara untuk pengembangan */}
          {/* <Route element={<ProtectedRoute />}> */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          {/* </Route> */}
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;