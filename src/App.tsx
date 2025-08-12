import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import SettingsPage from "./pages/SettingsPage";
import AccountSettings from "./pages/settings/AccountSettings";
import IntegrationsPage from "./pages/settings/IntegrationsPage";
import GoogleCalendarPage from "./pages/integrations/GoogleCalendarPage";
import RequestProjectPage from "./pages/RequestProjectPage";
import GoalsPage from "./pages/GoalsPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import MessagesPage from "./pages/MessagesPage";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={!user ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/"
          element={user ? <DashboardPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/projects"
          element={user ? <ProjectsPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/projects/:slug"
          element={user ? <ProjectDetailPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/request"
          element={user ? <RequestProjectPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/goals"
          element={user ? <GoalsPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/goals/:slug"
          element={user ? <GoalDetailPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/messages"
          element={user ? <MessagesPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/messages/:conversationId"
          element={user ? <MessagesPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={user ? <SettingsPage /> : <Navigate to="/login" />}
        >
          <Route index element={<Navigate to="account" />} />
          <Route path="account" element={<AccountSettings />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="integrations/google-calendar" element={<GoogleCalendarPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;