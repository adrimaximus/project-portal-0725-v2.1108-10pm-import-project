import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectPage from "./pages/ProjectPage";
import SettingsPage from "./pages/SettingsPage";
import { useAuth } from "./contexts/AuthContext";
import IntegrationsPage from "./pages/IntegrationsPage";
import GoogleCalendarPage from "./pages/integrations/GoogleCalendarPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a proper spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/*"
        element={
          <ProtectedRoute>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:slug" element={<ProjectPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/integrations" element={<IntegrationsPage />} />
              <Route path="/settings/integrations/google-calendar" element={<GoogleCalendarPage />} />
            </Routes>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;