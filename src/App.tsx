import { Route, Routes } from "react-router-dom";
import ProtectedRouteLayout from "./components/ProtectedRouteLayout";
import LoginPage from "./pages/LoginPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetail from "./pages/ProjectDetail";
import RequestPage from "./pages/Request";
import ChatPage from "./pages/ChatPage";
import MoodTracker from "./pages/MoodTracker";
import GoalsPage from "./pages/GoalsPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import Billing from "./pages/Billing";
import PeoplePage from "./pages/PeoplePage";
import PersonProfilePage from "./pages/people/PersonProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import CompaniesPage from "./pages/CompaniesPage";
import ContactPropertiesPage from "./pages/ContactPropertiesPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import FolderDetailPage from "./pages/kb/FolderDetailPage";
import Page from "./pages/kb/Page";
import NotificationsPage from "./pages/Notifications";
import Profile from "./pages/Profile";
import SearchPage from "./pages/SearchPage";
import UserManagementPage from "./pages/UserManagement";
import SettingsPage from "./pages/SettingsPage";
import TeamSettingsPage from "./pages/TeamSettingsPage";
import TagsSettingsPage from "./pages/TagsSettingsPage";
import WorkspaceSettingsPage from "./pages/WorkspaceSettingsPage";
import NavigationSettingsPage from "./pages/NavigationSettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import GoogleDrivePage from "./pages/integrations/GoogleDrivePage";
import OpenAiIntegrationPage from "./pages/integrations/OpenAiPage";
import WbiztoolPage from "./pages/integrations/WbiztoolPage";
import AuthLogsPage from "./pages/AuthLogsPage";
import CustomPage from "./pages/CustomPage";
import MultiEmbedPage from "./pages/MultiEmbedPage";
import MultiEmbedItemPage from "./pages/MultiEmbedItemPage";
import EmbedPage from "./pages/EmbedPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRouteLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/mood-tracker" element={<MoodTracker />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/:slug" element={<GoalDetailPage />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/people/:id" element={<PersonProfilePage />} />
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="/knowledge-base/folders/:slug" element={<FolderDetailPage />} />
        <Route path="/knowledge-base/pages/:slug" element={<Page />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/users" element={<UserManagementPage />} />
        
        {/* Settings Routes */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/team" element={<TeamSettingsPage />} />
        <Route path="/settings/tags" element={<TagsSettingsPage />} />
        <Route path="/settings/workspace" element={<WorkspaceSettingsPage />} />
        <Route path="/settings/navigation" element={<NavigationSettingsPage />} />
        <Route path="/settings/people-properties" element={<ContactPropertiesPage />} />
        <Route path="/settings/integrations" element={<IntegrationsPage />} />
        <Route path="/settings/integrations/google-drive" element={<GoogleDrivePage />} />
        <Route path="/settings/integrations/openai" element={<OpenAiIntegrationPage />} />
        <Route path="/settings/integrations/wbiztool" element={<WbiztoolPage />} />
        <Route path="/settings/auth-logs" element={<AuthLogsPage />} />

        {/* Custom/Embed Routes */}
        <Route path="/custom/:pageId" element={<CustomPage />} />
        <Route path="/custom-page/:navItemId" element={<MultiEmbedPage />} />
        <Route path="/custom-page/:navItemId/:itemId" element={<MultiEmbedItemPage />} />
        <Route path="/embed" element={<EmbedPage />} />
      </Route>

      {/* Catch-all for not found pages */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;