import React, { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from "react-router-dom";
import ProtectedRouteLayout from "./components/ProtectedRouteLayout";
import LoadingScreen from './components/LoadingScreen';
import ImpersonationBanner from "./components/ImpersonationBanner";

// Lazy load all pages
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const RequestPage = lazy(() => import("./pages/Request"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const MoodTracker = lazy(() => import("./pages/MoodTracker"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const GoalDetailPage = lazy(() => import("./pages/GoalDetailPage"));
const Billing = lazy(() => import("./pages/Billing"));
const PeoplePage = lazy(() => import("./pages/PeoplePage"));
const PersonProfilePage = lazy(() => import("./pages/people/PersonProfilePage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const CompaniesPage = lazy(() => import("./pages/CompaniesPage"));
const ContactPropertiesPage = lazy(() => import("./pages/ContactPropertiesPage"));
const KnowledgeBasePage = lazy(() => import("./pages/KnowledgeBasePage"));
const FolderDetailPage = lazy(() => import("./pages/kb/FolderDetailPage"));
const Page = lazy(() => import("./pages/kb/Page"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const UserManagementPage = lazy(() => import("./pages/UserManagement"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NavigationSettingsPage = lazy(() => import("./pages/NavigationSettingsPage"));
const TeamSettingsPage = lazy(() => import("./pages/TeamSettingsPage"));
const TagsSettingsPage = lazy(() => import("./pages/TagsSettingsPage"));
const WorkspaceSettingsPage = lazy(() => import("./pages/WorkspaceSettingsPage"));
const StorageSettingsPage = lazy(() => import("./pages/StorageSettingsPage"));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage"));
const GoogleDrivePage = lazy(() => import("./pages/integrations/GoogleDrivePage"));
const OpenAiPage = lazy(() => import("./pages/integrations/OpenAiPage"));
const WbiztoolPage = lazy(() => import("./pages/integrations/WbiztoolPage"));
const CustomPage = lazy(() => import("./pages/CustomPage"));
const MultiEmbedPage = lazy(() => import("./pages/MultiEmbedPage"));
const MultiEmbedItemPage = lazy(() => import("./pages/MultiEmbedItemPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => {
  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />

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
            <Route path="/settings/people-properties" element={<ContactPropertiesPage />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="/knowledge-base/folders/:slug" element={<FolderDetailPage />} />
            <Route path="/knowledge-base/pages/:slug" element={<Page />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/navigation" element={<NavigationSettingsPage />} />
            <Route path="/settings/team" element={<TeamSettingsPage />} />
            <Route path="/settings/tags" element={<TagsSettingsPage />} />
            <Route path="/settings/workspace" element={<WorkspaceSettingsPage />} />
            <Route path="/settings/storage" element={<StorageSettingsPage />} />
            <Route path="/settings/integrations" element={<IntegrationsPage />} />
            <Route path="/settings/integrations/google-drive" element={<GoogleDrivePage />} />
            <Route path="/settings/integrations/openai" element={<OpenAiPage />} />
            <Route path="/settings/integrations/wbiztool" element={<WbiztoolPage />} />
            
            {/* Custom pages using slug-based routing */}
            <Route path="/custom/:slug" element={<CustomPage />} />
            <Route path="/multipage/:slug" element={<MultiEmbedPage />} />
            <Route path="/multipage/:slug/:itemSlug" element={<MultiEmbedItemPage />} />
            
            {/* Catch-all for logged-in users */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Not Found Route for public pages */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <ImpersonationBanner />
    </>
  );
};

export default App;