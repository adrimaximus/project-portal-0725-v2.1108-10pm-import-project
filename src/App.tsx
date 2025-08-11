import { Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from './components/ProtectedRoute';

// Import all pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ResetPasswordPage from './pages/ResetPasswordPage';
import LandingPage from './pages/LandingPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import RequestPage from './pages/Request';
import ChatPage from './pages/ChatPage';
import MoodTracker from './pages/MoodTracker';
import GoalsPage from './pages/GoalsPage';
import GoalDetailPage from './pages/GoalDetailPage';
import Billing from './pages/Billing';
import NotificationsPage from './pages/Notifications';
import Profile from './pages/Profile';
import SearchPage from './pages/SearchPage';
import UserManagementPage from './pages/UserManagement';
import SettingsPage from './pages/Settings';
import TeamSettingsPage from './pages/TeamSettingsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import OpenAiIntegrationPage from './pages/integrations/OpenAiIntegrationPage';
import GitHubPage from './pages/integrations/GitHubPage';
import SlackPage from './pages/integrations/SlackPage';
import GoogleDrivePage from './pages/integrations/GoogleDrivePage';
import GoogleCalendarPage from './pages/integrations/GoogleCalendarPage';
import NavigationSettingsPage from './pages/NavigationSettingsPage';
import EmbedPage from './pages/EmbedPage';
import NotFound from './pages/NotFound';

function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/projects/new" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
        <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
        <Route path="/request" element={<ProtectedRoute><RequestPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/mood-tracker" element={<ProtectedRoute><MoodTracker /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
        <Route path="/goals/:slug" element={<ProtectedRoute><GoalDetailPage /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/settings/team" element={<ProtectedRoute><TeamSettingsPage /></ProtectedRoute>} />
        <Route path="/settings/navigation" element={<ProtectedRoute><NavigationSettingsPage /></ProtectedRoute>} />
        <Route path="/settings/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
        <Route path="/settings/integrations/openai" element={<ProtectedRoute><OpenAiIntegrationPage /></ProtectedRoute>} />
        <Route path="/settings/integrations/github" element={<ProtectedRoute><GitHubPage /></ProtectedRoute>} />
        <Route path="/settings/integrations/slack" element={<ProtectedRoute><SlackPage /></ProtectedRoute>} />
        <Route path="/settings/integrations/google-drive" element={<ProtectedRoute><GoogleDrivePage /></ProtectedRoute>} />
        <Route path="/settings/integrations/google-calendar" element={<ProtectedRoute><GoogleCalendarPage /></ProtectedRoute>} />
        <Route path="/custom" element={<ProtectedRoute><EmbedPage /></ProtectedRoute>} />

        {/* Catch-all Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;