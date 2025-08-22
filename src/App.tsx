import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRouteLayout from "./components/ProtectedRouteLayout";

import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import RequestPage from "./pages/Request";
import ChatPage from "./pages/ChatPage";
import MoodTracker from "./pages/MoodTracker";
import GoalsPage from "./pages/GoalsPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import Billing from "./pages/Billing";
import NotificationsPage from "./pages/Notifications";
import Profile from "./pages/Profile";
import SearchPage from "./pages/SearchPage";
import UserManagementPage from "./pages/UserManagement";
import UserProfilePage from "./pages/UserProfilePage";
import SettingsPage from "./pages/Settings";
import TeamSettingsPage from "./pages/TeamSettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import OpenAiIntegrationPage from "./pages/integrations/OpenAiIntegrationPage";
import NavigationSettingsPage from "./pages/NavigationSettingsPage";
import EmbedPage from "./pages/EmbedPage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import GitHubPage from "./pages/integrations/GitHubPage";
import SlackPage from "./pages/integrations/SlackPage";
import GoogleDrivePage from "./pages/integrations/GoogleDrivePage";
import GoogleCalendarPage from "./pages/integrations/GoogleCalendarPage";
import PeoplePage from "./pages/PeoplePage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import FolderDetailPage from "./pages/kb/FolderDetailPage";
import ArticlePage from "./pages/kb/ArticlePage";

const ADMIN_ROLES = ['admin', 'master admin'];

function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        
        {/* General Protected Routes */}
        <Route element={<ProtectedRouteLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/mood-tracker" element={<MoodTracker />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/goals/:slug" element={<GoalDetailPage />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />
          <Route path="/custom" element={<EmbedPage />} />
          <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="/knowledge-base/folders/:slug" element={<FolderDetailPage />} />
          <Route path="/knowledge-base/articles/:slug" element={<ArticlePage />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRouteLayout allowedRoles={ADMIN_ROLES} />}>
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/team" element={<TeamSettingsPage />} />
          <Route path="/settings/integrations" element={<IntegrationsPage />} />
          <Route path="/settings/integrations/openai" element={<OpenAiIntegrationPage />} />
          <Route path="/settings/integrations/github" element={<GitHubPage />} />
          <Route path="/settings/integrations/slack" element={<SlackPage />} />
          <Route path="/settings/integrations/google-drive" element={<GoogleDrivePage />} />
          <Route path="/settings/integrations/google-calendar" element={<GoogleCalendarPage />} />
          <Route path="/settings/navigation" element={<NavigationSettingsPage />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;