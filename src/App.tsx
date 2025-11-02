import { Route, Routes } from 'react-router-dom';
import ProtectedRouteLayout from '@/components/ProtectedRouteLayout';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import Index from '@/pages/Index';
import ProjectsPage from '@/pages/Projects';
import ProjectDetailPage from '@/pages/projects/[slug]';
import Billing from '@/pages/Billing';
import RequestPage from '@/pages/Request';
import ChatPage from '@/pages/ChatPage';
import MoodTracker from '@/pages/MoodTracker';
import GoalsPage from '@/pages/GoalsPage';
import GoalDetailPage from '@/pages/GoalDetailPage';
import PeoplePage from '@/pages/PeoplePage';
import PersonProfilePage from '@/pages/people/PersonProfilePage';
import UserProfilePage from '@/pages/UserProfilePage';
import KnowledgeBasePage from '@/pages/KnowledgeBasePage';
import FolderDetailPage from '@/pages/kb/FolderDetailPage';
import Page from '@/pages/kb/Page';
import SettingsPage from '@/pages/Settings';
import TeamSettingsPage from '@/pages/TeamSettingsPage';
import NavigationSettingsPage from '@/pages/NavigationSettingsPage';
import IntegrationsPage from '@/pages/IntegrationsPage';
import GoogleDrivePage from '@/pages/integrations/GoogleDrivePage';
import GoogleCalendarIntegrationPage from '@/pages/integrations/GoogleCalendarIntegrationPage';
import OpenAiIntegrationPage from '@/pages/integrations/OpenAiIntegrationPage';
import WbiztoolPage from '@/pages/integrations/WbiztoolPage';
import ServicesSettingsPage from '@/pages/ServicesSettingsPage';
import TagsSettingsPage from '@/pages/TagsSettingsPage';
import ThemeSettingsPage from '@/pages/ThemeSettingsPage';
import NotificationSettingsPage from '@/pages/NotificationSettingsPage';
import StorageSettingsPage from '@/pages/StorageSettingsPage';
import WorkspaceSettingsPage from '@/pages/WorkspaceSettingsPage';
import ContactPropertiesPage from '@/pages/ContactPropertiesPage';
import CompanyPropertiesPage from '@/pages/CompanyPropertiesPage';
import PropertiesSettingsPage from '@/pages/PropertiesSettingsPage';
import TagsPropertiesPage from '@/pages/TagsPropertiesPage';
import NotificationsPage from '@/pages/Notifications';
import Profile from '@/pages/Profile';
import SearchPage from '@/pages/SearchPage';
import UserManagementPage from '@/pages/UserManagement';
import CustomPage from '@/pages/CustomPage';
import MultiEmbedPage from '@/pages/MultiEmbedPage';
import MultiEmbedItemPage from '@/pages/MultiEmbedItemPage';
import EmbedPage from '@/pages/EmbedPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import NotFound from '@/pages/NotFound';
import LandingPage from '@/pages/LandingPage';
import AuthHandler from '@/components/AuthHandler';

function App() {
  return (
    <>
      <AuthHandler />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/" element={<LandingPage />} />

        <Route element={<ProtectedRouteLayout />}>
          <Route path="/dashboard" element={<Index />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          <Route path="/tasks/:taskId" element={<ProjectsPage />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/mood-tracker" element={<MoodTracker />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/goals/:slug" element={<GoalDetailPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/people/:slug" element={<PersonProfilePage />} />
          <Route path="/users/:id" element={<UserProfilePage />} />
          <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="/knowledge-base/folders/:slug" element={<FolderDetailPage />} />
          <Route path="/knowledge-base/pages/:slug" element={<Page />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/team" element={<TeamSettingsPage />} />
          <Route path="/settings/navigation" element={<NavigationSettingsPage />} />
          <Route path="/settings/integrations" element={<IntegrationsPage />} />
          <Route path="/settings/integrations/google-drive" element={<GoogleDrivePage />} />
          <Route path="/settings/integrations/google-calendar" element={<GoogleCalendarIntegrationPage />} />
          <Route path="/settings/integrations/openai" element={<OpenAiIntegrationPage />} />
          <Route path="/settings/integrations/wbiztool" element={<WbiztoolPage />} />
          <Route path="/settings/services" element={<ServicesSettingsPage />} />
          <Route path="/settings/tags" element={<TagsSettingsPage />} />
          <Route path="/settings/theme" element={<ThemeSettingsPage />} />
          <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
          <Route path="/settings/storage" element={<StorageSettingsPage />} />
          <Route path="/settings/workspace" element={<WorkspaceSettingsPage />} />
          <Route path="/settings/people-properties" element={<ContactPropertiesPage />} />
          <Route path="/settings/company-properties" element={<CompanyPropertiesPage />} />
          <Route path="/settings/properties" element={<PropertiesSettingsPage />} />
          <Route path="/settings/tags-properties" element={<TagsPropertiesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/custom/:slug" element={<CustomPage />} />
          <Route path="/multipage/:slug" element={<MultiEmbedPage />} />
          <Route path="/multipage/:slug/:itemSlug" element={<MultiEmbedItemPage />} />
          <Route path="/embed" element={<EmbedPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;