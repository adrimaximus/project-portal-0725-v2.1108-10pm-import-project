import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useUser } from './contexts/UserContext';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import RequestPage from './pages/Request';
import ChatPage from './pages/ChatPage';
import MoodTracker from './pages/MoodTracker';
import GoalsPage from './pages/GoalsPage';
import GoalDetailPage from './pages/GoalDetailPage';
import Billing from './pages/Billing';
import NotificationsPage from './pages/Notifications';
import Profile from './pages/Profile';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/Settings';
import TeamSettingsPage from './pages/TeamSettingsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import GoogleCalendarPage from './pages/integrations/GoogleCalendarPage';
import OpenAiIntegrationPage from './pages/integrations/OpenAiIntegrationPage';
import NavigationSettingsPage from './pages/NavigationSettingsPage';
import EmbedPage from './pages/EmbedPage';
import NotFound from './pages/NotFound';

const ProtectedRoute = () => {
  const { session, isLoading } = useUser();

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const { session, isLoading } = useUser();

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  return !session ? <Outlet /> : <Navigate to="/" replace />;
};

function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/mood-tracker" element={<MoodTracker />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/:goalId" element={<GoalDetailPage />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/team" element={<TeamSettingsPage />} />
        <Route path="/settings/navigation" element={<NavigationSettingsPage />} />
        <Route path="/settings/integrations" element={<IntegrationsPage />} />
        <Route path="/settings/integrations/google-calendar" element={<GoogleCalendarPage />} />
        <Route path="/settings/integrations/openai" element={<OpenAiIntegrationPage />} />
        <Route path="/custom" element={<EmbedPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;