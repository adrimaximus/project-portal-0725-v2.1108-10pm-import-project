import { Route, Routes } from "react-router-dom";
import ProtectedRouteLayout from "./components/ProtectedRouteLayout";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Index";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/projects/[slug]";
import Request from "./pages/Request";
import Chat from "./pages/ChatPage";
import MoodTracker from "./pages/MoodTracker";
import Goals from "./pages/Goals";
import GoalDetail from "./pages/GoalDetailPage";
import Billing from "./pages/Billing";
import People from "./pages/PeoplePage";
import PersonProfile from "./pages/people/PersonProfilePage";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import KnowledgeBase from "./pages/KnowledgeBasePage";
import FolderDetail from "./pages/kb/FolderDetailPage";
import ArticleDetail from "./pages/kb/Page";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Search from "./pages/SearchPage";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import TeamSettings from "./pages/TeamSettingsPage";
import NavigationSettings from "./pages/NavigationSettingsPage";
import TagsSettings from "./pages/TagsSettingsPage";
import ThemeSettings from "./pages/ThemeSettingsPage";
import ServicesSettings from "./pages/ServicesSettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import GoogleDrivePage from "./pages/integrations/GoogleDrivePage";
import GoogleCalendarIntegrationPage from "./pages/integrations/GoogleCalendarIntegrationPage";
import WbiztoolPage from "./pages/integrations/WbiztoolPage";
import OpenAiIntegrationPage from "./pages/integrations/OpenAiIntegrationPage";
import EmailitPage from "./pages/integrations/EmailitPage";
import WorkspaceSettingsPage from "./pages/WorkspaceSettingsPage";
import StorageSettingsPage from "./pages/StorageSettingsPage";
import PropertiesSettingsPage from "./pages/PropertiesSettingsPage";
import CompanyPropertiesPage from "./pages/CompanyPropertiesPage";
import ContactPropertiesPage from "./pages/ContactPropertiesPage";
import TagsPropertiesPage from "./pages/TagsPropertiesPage";
import CustomPage from "./pages/CustomPage";
import MultiEmbedPage from "./pages/MultiEmbedPage";
import MultiEmbedItemPage from "./pages/MultiEmbedItemPage";
import EmbedPage from "./pages/EmbedPage";
import LandingPage from "./pages/LandingPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import UserProfilePage from "./pages/UserProfilePage";
import NotFound from "./pages/NotFound";
import AuthHandler from "./components/AuthHandler";
import ProjectStatusesPage from "./pages/settings/ProjectStatusesPage";
import PaymentStatusesPage from "./pages/settings/PaymentStatusesPage";
import { TaskModalProvider } from "./contexts/TaskModalContext";
import GlobalTaskModal from "./components/GlobalTaskModal";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import { TaskDrawerProvider } from "./contexts/TaskDrawerContext";
import GlobalTaskDrawer from "./components/GlobalTaskDrawer";
import TaskRedirectPage from "./pages/TaskRedirectPage";

function App() {
  return (
    <>
      <AuthHandler />
      <TaskModalProvider>
        <TaskDrawerProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

            <Route element={<ProtectedRouteLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:slug" element={<ProjectDetail />} />
              <Route path="/tasks/:taskId" element={<TaskRedirectPage />} />
              <Route path="/request" element={<Request />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/mood-tracker" element={<MoodTracker />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/goals/:slug" element={<GoalDetail />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/people" element={<People />} />
              <Route path="/people/:slug" element={<PersonProfile />} />
              <Route path="/companies/:slug" element={<CompanyProfilePage />} />
              <Route path="/users/:id" element={<UserProfilePage />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/knowledge-base/folders/:slug" element={<FolderDetail />} />
              <Route path="/knowledge-base/pages/:slug" element={<ArticleDetail />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/search" element={<Search />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/team" element={<TeamSettings />} />
              <Route path="/settings/navigation" element={<NavigationSettings />} />
              <Route path="/settings/tags" element={<TagsSettings />} />
              <Route path="/settings/theme" element={<ThemeSettings />} />
              <Route path="/settings/services" element={<ServicesSettings />} />
              <Route path="/settings/integrations" element={<IntegrationsPage />} />
              <Route path="/settings/integrations/google-drive" element={<GoogleDrivePage />} />
              <Route path="/settings/integrations/google-calendar" element={<GoogleCalendarIntegrationPage />} />
              <Route path="/settings/integrations/wbiztool" element={<WbiztoolPage />} />
              <Route path="/settings/integrations/openai" element={<OpenAiIntegrationPage />} />
              <Route path="/settings/integrations/emailit" element={<EmailitPage />} />
              <Route path="/settings/workspace" element={<WorkspaceSettingsPage />} />
              <Route path="/settings/storage" element={<StorageSettingsPage />} />
              <Route path="/settings/properties" element={<PropertiesSettingsPage />} />
              <Route path="/settings/company-properties" element={<CompanyPropertiesPage />} />
              <Route path="/settings/people-properties" element={<ContactPropertiesPage />} />
              <Route path="/settings/tags-properties" element={<TagsPropertiesPage />} />
              <Route path="/settings/project-statuses" element={<ProjectStatusesPage />} />
              <Route path="/settings/payment-statuses" element={<PaymentStatusesPage />} />
              <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
              <Route path="/custom/:slug" element={<CustomPage />} />
              <Route path="/multipage/:slug" element={<MultiEmbedPage />} />
              <Route path="/multipage/:slug/:itemSlug" element={<MultiEmbedItemPage />} />
              <Route path="/embed" element={<EmbedPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <GlobalTaskModal />
          <GlobalTaskDrawer />
        </TaskDrawerProvider>
      </TaskModalProvider>
    </>
  );
}

export default App;