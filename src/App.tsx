import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRouteLayout from "./components/ProtectedRouteLayout";
import PermissionGuard from "./components/PermissionGuard";

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
import Page from "./pages/kb/Page";

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
        
        {/* Protected Routes */}
        <Route element={<ProtectedRouteLayout />}>
          <Route path="/dashboard" element={<PermissionGuard permission="module:dashboard"><DashboardPage /></PermissionGuard>} />
          <Route path="/projects" element={<PermissionGuard permission="module:projects"><Projects /></PermissionGuard>} />
          <Route path="/projects/:slug" element={<PermissionGuard permission="module:projects"><ProjectDetail /></PermissionGuard>} />
          <Route path="/request" element={<PermissionGuard permission="module:request"><RequestPage /></PermissionGuard>} />
          <Route path="/chat" element={<PermissionGuard permission="module:chat"><ChatPage /></PermissionGuard>} />
          <Route path="/mood-tracker" element={<PermissionGuard permission="module:mood-tracker"><MoodTracker /></PermissionGuard>} />
          <Route path="/goals" element={<PermissionGuard permission="module:goals"><GoalsPage /></PermissionGuard>} />
          <Route path="/goals/:slug" element={<PermissionGuard permission="module:goals"><GoalDetailPage /></PermissionGuard>} />
          <Route path="/billing" element={<PermissionGuard permission="module:billing"><Billing /></PermissionGuard>} />
          <Route path="/people" element={<PermissionGuard permission="module:people"><PeoplePage /></PermissionGuard>} />
          <Route path="/knowledge-base" element={<PermissionGuard permission="module:knowledge-base"><KnowledgeBasePage /></PermissionGuard>} />
          <Route path="/knowledge-base/folders/:slug" element={<PermissionGuard permission="module:knowledge-base"><FolderDetailPage /></PermissionGuard>} />
          <Route path="/knowledge-base/pages/:slug" element={<PermissionGuard permission="module:knowledge-base"><Page /></PermissionGuard>} />
          
          {/* Settings are a special group */}
          <Route path="/settings" element={<PermissionGuard permission="module:settings"><SettingsPage /></PermissionGuard>} />
          <Route path="/settings/team" element={<PermissionGuard permission="module:settings"><TeamSettingsPage /></PermissionGuard>} />
          <Route path="/settings/integrations" element={<PermissionGuard permission="module:settings"><IntegrationsPage /></PermissionGuard>} />
          <Route path="/settings/integrations/openai" element={<PermissionGuard permission="module:settings"><OpenAiIntegrationPage /></PermissionGuard>} />
          <Route path="/settings/integrations/github" element={<PermissionGuard permission="module:settings"><GitHubPage /></PermissionGuard>} />
          <Route path="/settings/integrations/slack" element={<PermissionGuard permission="module:settings"><SlackPage /></PermissionGuard>} />
          <Route path="/settings/integrations/google-drive" element={<PermissionGuard permission="module:settings"><GoogleDrivePage /></PermissionGuard>} />
          <Route path="/settings/integrations/google-calendar" element={<PermissionGuard permission="module:settings"><GoogleCalendarPage /></PermissionGuard>} />
          <Route path="/settings/navigation" element={<PermissionGuard permission="module:settings"><NavigationSettingsPage /></PermissionGuard>} />

          {/* Routes accessible to all authenticated users */}
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />
          <Route path="/custom" element={<EmbedPage />} />
          <Route path="/users" element={<UserManagementPage />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;