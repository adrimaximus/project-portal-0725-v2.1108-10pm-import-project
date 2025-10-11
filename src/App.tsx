import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRouteLayout from "./components/ProtectedRouteLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
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
import CompanyPropertiesPage from "./pages/CompanyPropertiesPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import FolderDetailPage from "./pages/kb/FolderDetailPage";
import KbPage from "./pages/kb/Page";
import NotificationsPage from "./pages/Notifications";
import ProfilePage from "./pages/Profile";
import SearchPage from "./pages/SearchPage";
import SettingsPage from "./pages/SettingsPage";
import TeamSettingsPage from "./pages/TeamSettingsPage";
import WorkspaceSettingsPage from "./pages/WorkspaceSettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import GoogleCalendarIntegrationPage from "./pages/GoogleCalendarIntegrationPage";
import GoogleDrivePage from "./pages/integrations/GoogleDrivePage";
import OpenAiIntegrationPage from "./pages/integrations/OpenAiIntegrationPage";
import WbiztoolPage from "./pages/integrations/WbiztoolPage";
import NavigationSettingsPage from "./pages/NavigationSettingsPage";
import TagsSettingsPage from "./pages/TagsSettingsPage";
import StorageSettingsPage from "./pages/StorageSettingsPage";
import CustomPage from "./pages/CustomPage";
import MultiEmbedPage from "./pages/MultiEmbedPage";
import MultiEmbedItemPage from "./pages/MultiEmbedItemPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import NotFound from "./pages/NotFound";
import ThemeSettingsPage from "./pages/ThemeSettingsPage";
import TestEditorPage from "./pages/TestEditor";

function App() {
  useEffect(() => {
    const unlockAudio = () => {
      // Create a silent audio element to unlock audio context
      const sound = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
      sound.volume = 0;
      sound.play().catch(() => {
        // Autoplay was prevented, but this is expected and fine.
        // The user interaction gesture is now "consumed" by the browser for audio.
      });
      
      // Remove the event listener after the first interaction
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio); // For mobile

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />

      {/* Protected routes */}
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
        <Route path="/people/:slug" element={<PersonProfilePage />} />
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/settings/people-properties" element={<ContactPropertiesPage />} />
        <Route path="/settings/company-properties" element={<CompanyPropertiesPage />} />
        <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="/knowledge-base/folders/:slug" element={<FolderDetailPage />} />
        <Route path="/knowledge-base/pages/:slug" element={<KbPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/team" element={<TeamSettingsPage />} />
        <Route path="/settings/workspace" element={<WorkspaceSettingsPage />} />
        <Route path="/settings/integrations" element={<IntegrationsPage />} />
        <Route path="/settings/integrations/google-calendar" element={<GoogleCalendarIntegrationPage />} />
        <Route path="/settings/integrations/google-drive" element={<GoogleDrivePage />} />
        <Route path="/settings/integrations/openai" element={<OpenAiIntegrationPage />} />
        <Route path="/settings/integrations/wbiztool" element={<WbiztoolPage />} />
        <Route path="/settings/navigation" element={<NavigationSettingsPage />} />
        <Route path="/settings/tags" element={<TagsSettingsPage />} />
        <Route path="/settings/theme" element={<ThemeSettingsPage />} />
        <Route path="/settings/storage" element={<StorageSettingsPage />} />
        <Route path="/custom/:slug" element={<CustomPage />} />
        <Route path="/multipage/:slug" element={<MultiEmbedPage />} />
        <Route path="/multipage/:slug/:itemSlug" element={<MultiEmbedItemPage />} />
        <Route path="/test-editor" element={<TestEditorPage />} />
      </Route>

      {/* Not Found Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;