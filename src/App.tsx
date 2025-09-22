import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRouteLayout from "./components/ProtectedRouteLayout";
import PermissionGuard from "./components/PermissionGuard";
import MasterAdminGuard from "./components/MasterAdminGuard";
import LoadingScreen from "./components/LoadingScreen";
import ImpersonationBanner from "./components/ImpersonationBanner";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const RequestPage = lazy(() => import("./pages/Request"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const MoodTracker = lazy(() => import("./pages/MoodTracker"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const GoalDetailPage = lazy(() => import("./pages/GoalDetailPage"));
const Billing = lazy(() => import("./pages/Billing"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const UserManagementPage = lazy(() => import("./pages/UserManagement"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const TeamSettingsPage = lazy(() => import("./pages/TeamSettingsPage"));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage"));
const OpenAiIntegrationPage = lazy(() => import("./pages/integrations/OpenAiIntegrationPage"));
const NavigationSettingsPage = lazy(() => import("./pages/NavigationSettingsPage"));
const EmbedPage = lazy(() => import("./pages/EmbedPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const GoogleDrivePage = lazy(() => import("./pages/integrations/GoogleDrivePage"));
const PeoplePage = lazy(() => import("./pages/PeoplePage"));
const PersonProfilePage = lazy(() => import("./pages/people/PersonProfilePage"));
const KnowledgeBasePage = lazy(() => import("./pages/KnowledgeBasePage"));
const FolderDetailPage = lazy(() => import("./pages/kb/FolderDetailPage"));
const Page = lazy(() => import("./pages/kb/Page"));
const WorkspaceSettingsPage = lazy(() => import("./pages/WorkspaceSettingsPage"));
const ContactPropertiesPage = lazy(() => import("./pages/ContactPropertiesPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const CompaniesPage = lazy(() => import("./pages/CompaniesPage"));
const TagsSettingsPage = lazy(() => import("./pages/TagsSettingsPage"));
const WbiztoolPage = lazy(() => import("./pages/integrations/WbiztoolPage"));

function App() {
  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRouteLayout />}>
            <Route path="/dashboard" element={<PermissionGuard permission="module:dashboard"><DashboardPage /></PermissionGuard>} />
            <Route path="/projects" element={<PermissionGuard permission="module:projects"><ProjectsPage /></PermissionGuard>} />
            <Route path="/projects/:slug" element={<PermissionGuard permission="module:projects"><ProjectDetail /></PermissionGuard>} />
            <Route path="/request" element={<PermissionGuard permission="module:request"><RequestPage /></PermissionGuard>} />
            <Route path="/chat" element={<PermissionGuard permission="module:chat"><ChatPage /></PermissionGuard>} />
            <Route path="/mood-tracker" element={<PermissionGuard permission="module:mood-tracker"><MoodTracker /></PermissionGuard>} />
            <Route path="/goals" element={<PermissionGuard permission="module:goals"><GoalsPage /></PermissionGuard>} />
            <Route path="/goals/:slug" element={<PermissionGuard permission="module:goals"><GoalDetailPage /></PermissionGuard>} />
            <Route path="/billing" element={<PermissionGuard permission="module:billing"><Billing /></PermissionGuard>} />
            <Route path="/people" element={<PermissionGuard permission="module:people"><PeoplePage /></PermissionGuard>} />
            <Route path="/people/companies" element={<PermissionGuard permission="module:people"><CompaniesPage /></PermissionGuard>} />
            <Route path="/people/:id" element={<PermissionGuard permission="module:people"><PersonProfilePage /></PermissionGuard>} />
            <Route path="/knowledge-base" element={<PermissionGuard permission="module:knowledge-base"><KnowledgeBasePage /></PermissionGuard>} />
            <Route path="/knowledge-base/folders/:slug" element={<PermissionGuard permission="module:knowledge-base"><FolderDetailPage /></PermissionGuard>} />
            <Route path="/knowledge-base/pages/:slug" element={<PermissionGuard permission="module:knowledge-base"><Page /></PermissionGuard>} />
            
            {/* Settings are a special group */}
            <Route path="/settings" element={<PermissionGuard permission="module:settings"><SettingsPage /></PermissionGuard>} />
            <Route path="/settings/workspace" element={<MasterAdminGuard><WorkspaceSettingsPage /></MasterAdminGuard>} />
            <Route path="/settings/team" element={<PermissionGuard permission="users:manage"><TeamSettingsPage /></PermissionGuard>} />
            <Route path="/settings/people-properties" element={<PermissionGuard permission="users:manage"><ContactPropertiesPage /></PermissionGuard>} />
            <Route path="/settings/integrations" element={<PermissionGuard permission="settings:manage_integrations"><IntegrationsPage /></PermissionGuard>} />
            <Route path="/settings/integrations/openai" element={<PermissionGuard permission="settings:manage_integrations"><OpenAiIntegrationPage /></PermissionGuard>} />
            <Route path="/settings/integrations/google-drive" element={<PermissionGuard permission="settings:manage_integrations"><GoogleDrivePage /></PermissionGuard>} />
            <Route path="/settings/integrations/wbiztool" element={<PermissionGuard permission="settings:manage_integrations"><WbiztoolPage /></PermissionGuard>} />
            <Route path="/settings/navigation" element={<PermissionGuard permission="module:settings"><NavigationSettingsPage /></PermissionGuard>} />
            <Route path="/settings/tags" element={<PermissionGuard permission="module:settings"><TagsSettingsPage /></PermissionGuard>} />

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
      </Suspense>
      <Toaster />
      <ImpersonationBanner />
    </>
  );
}

export default App;