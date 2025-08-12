import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from './contexts/AuthContext';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import SettingsPage from './pages/settings/SettingsPage';
import IntegrationsPage from './pages/integrations/IntegrationsPage';
import GoogleCalendarPage from './pages/integrations/GoogleCalendarPage';
import NewProjectRequest from './pages/request/NewProjectRequest';
import { Loader2 } from 'lucide-react';

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={session ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="/projects" element={session ? <ProjectsPage /> : <Navigate to="/login" />} />
        <Route path="/projects/:id" element={session ? <ProjectDetailPage /> : <Navigate to="/login" />} />
        <Route path="/request/new" element={session ? <NewProjectRequest /> : <Navigate to="/login" />} />
        <Route path="/settings" element={session ? <SettingsPage /> : <Navigate to="/login" />} />
        <Route path="/settings/integrations" element={session ? <IntegrationsPage /> : <Navigate to="/login" />} />
        <Route path="/settings/integrations/google-calendar" element={session ? <GoogleCalendarPage /> : <Navigate to="/login" />} />

        <Route path="*" element={<Navigate to={session ? "/" : "/login"} />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;