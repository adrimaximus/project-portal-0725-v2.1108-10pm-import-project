import { Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import RequestPage from './pages/Request';
import ChatPage from './pages/ChatPage';
import MoodTracker from './pages/MoodTracker';
import GoalsPage from './pages/GoalsPage';
import GoalDetailPage from './pages/GoalDetailPage';
import GoalEditPage from './pages/GoalEditPage';
import Billing from './pages/Billing';
import NotificationsPage from './pages/Notifications';
import Profile from './pages/Profile';
import SettingsPage from './pages/Settings';
import TeamSettingsPage from './pages/TeamSettingsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import OpenAiIntegrationPage from './pages/integrations/OpenAiIntegrationPage';
import { GoogleCalendarPage } from './pages/integrations/GoogleCalendarPage';
import NavigationSettingsPage from './pages/NavigationSettingsPage';
import EmbedPage from './pages/EmbedPage';
import SearchPage from './pages/SearchPage';
import UserManagementPage from './pages/UserManagement';
import LoginPage from './pages/LoginPage';
import AppLayout from './components/AppLayout';
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/mood-tracker" element={<MoodTracker />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/goals/:goalId" element={<GoalDetailPage />} />
          <Route path="/goals/edit/:id" element={<GoalEditPage />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/team" element={<TeamSettingsPage />} />
          <Route path="/settings/integrations" element={<IntegrationsPage />} />
          <Route path="/settings/integrations/openai" element={<OpenAiIntegrationPage />} />
          <Route path="/settings/integrations/google-calendar" element={<GoogleCalendarPage />} />
          <Route path="/settings/navigation" element={<NavigationSettingsPage />} />
          <Route path="/custom" element={<EmbedPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/users" element={<UserManagementPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;