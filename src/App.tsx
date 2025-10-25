"use client";

import { Route, Routes } from "react-router-dom";
import ProtectedRouteLayout from "@/components/ProtectedRouteLayout";

// Public Pages
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import LandingPage from "@/pages/LandingPage";
import TermsOfServicePage from "@/pages/TermsOfServicePage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import NotFound from "@/pages/NotFound";

// Protected Pages
import DashboardPage from "@/pages/Dashboard";
import ProjectsPage from "@/pages/Projects";
import ProjectDetailPage from "@/pages/projects/[slug]";
import RequestPage from "@/pages/Request";
import ChatPage from "@/pages/ChatPage";
import MoodTrackerPage from "@/pages/MoodTracker";
import GoalsPage from "@/pages/GoalsPage";
import GoalPage from "@/pages/GoalDetailPage";
import BillingPage from "@/pages/Billing";
import PeoplePage from "@/pages/PeoplePage";
import PersonDetailPage from "@/pages/people/PersonProfilePage";
import UserProfilePage from "@/pages/UserProfilePage";
import CompaniesPage from "@/pages/CompaniesPage";
import ContactPropertiesPage from "@/pages/ContactPropertiesPage";
import CompanyPropertiesPage from "@/pages/CompanyPropertiesPage";
import KnowledgeBasePage from "@/pages/KnowledgeBasePage";
import KnowledgeBaseFolderPage from "@/pages/kb/FolderDetailPage";
import KnowledgeBaseArticlePage from "@/pages/kb/Page";
import SettingsPage from "@/pages/SettingsPage";
import TeamSettingsPage from "@/pages/TeamSettingsPage";
import TagsSettingsPage from "@/pages/TagsSettingsPage";
import NavigationSettingsPage from "@/pages/NavigationSettingsPage";
import ThemeSettingsPage from "@/pages/ThemeSettingsPage";
import ServicesSettingsPage from "@/pages/ServicesSettingsPage";
import NotificationSettingsPage from "@/pages/NotificationSettingsPage";
import WorkspaceSettingsPage from "@/pages/WorkspaceSettingsPage";
import StorageSettingsPage from "@/pages/StorageSettingsPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import GoogleDriveIntegrationPage from "@/pages/integrations/GoogleDrivePage";
import GoogleCalendarIntegrationPage from "@/pages/GoogleCalendarIntegrationPage";
import SpeechToTextPage from "@/pages/integrations/SpeechToTextPage";
import OpenAiIntegrationPage from "@/pages/integrations/OpenAiIntegrationPage";
import WbiztoolPage from "@/pages/integrations/WbiztoolPage";
import EmailitPage from "@/pages/integrations/EmailitPage";
import MultiEmbedPage from "@/pages/MultiEmbedPage";
import MultiEmbedItemPage from "@/pages/MultiEmbedItemPage";
import CustomPage from "@/pages/CustomPage";
import EmbedPage from "@/pages/EmbedPage";
import ProfilePage from "@/pages/Profile";
import SearchPage from "@/pages/SearchPage";
import UserManagementPage from "@/pages/UserManagement";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRouteLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:conversationId" element={<ChatPage />} />
        <Route path="/mood-tracker" element={<MoodTrackerPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/:slug" element={<GoalPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/people/:slug" element={<PersonDetailPage />} />
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/settings/people-properties" element={<ContactPropertiesPage />} />
        <Route path="/settings/company-properties" element={<CompanyPropertiesPage />} />
        <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
        <Route
          path="/knowledge-base/folders/:slug"
          element={<KnowledgeBaseFolderPage />}
        />
        <Route
          path="/knowledge-base/pages/:slug"
          element={<KnowledgeBaseArticlePage />}
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/team" element={<TeamSettingsPage />} />
        <Route path="/settings/tags" element={<TagsSettingsPage />} />
        <Route path="/settings/navigation" element={<NavigationSettingsPage />} />
        <Route path="/settings/theme" element={<ThemeSettingsPage />} />
        <Route path="/settings/services" element={<ServicesSettingsPage />} />
        <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
        <Route path="/settings/workspace" element={<WorkspaceSettingsPage />} />
        <Route path="/settings/storage" element={<StorageSettingsPage />} />
        <Route
          path="/settings/integrations"
          element={<IntegrationsPage />}
        />
        <Route
          path="/settings/integrations/google-drive"
          element={<GoogleDriveIntegrationPage />}
        />
        <Route
          path="/settings/integrations/google-calendar"
          element={<GoogleCalendarIntegrationPage />}
        />
        <Route
          path="/settings/integrations/speech-to-text"
          element={<SpeechToTextPage />}
        />
        <Route
          path="/settings/integrations/openai"
          element={<OpenAiIntegrationPage />}
        />
        <Route
          path="/settings/integrations/wbiztool"
          element={<WbiztoolPage />}
        />
        <Route
          path="/settings/integrations/emailit"
          element={<EmailitPage />}
        />
        <Route path="/multipage/:slug" element={<MultiEmbedPage />} />
        <Route path="/multipage/:slug/:itemSlug" element={<MultiEmbedItemPage />} />
        <Route path="/custom/:slug" element={<CustomPage />} />
        <Route path="/embed" element={<EmbedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/users" element={<UserManagementPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;