import React, { Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useFeatures } from "./contexts/FeaturesContext";
import { useAuth } from "./contexts/AuthContext";
import AppSkeleton from "./components/AppSkeleton";

// Lazy load all page components
const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const DashboardPage = React.lazy(() => import("./pages/Dashboard"));
const Projects = React.lazy(() => import("./pages/Projects"));
const ProjectDetail = React.lazy(() => import("./pages/ProjectDetail"));
const RequestPage = React.lazy(() => import("./pages/Request"));
const ChatPage = React.lazy(() => import("./pages/ChatPage"));
const MoodTracker = React.lazy(() => import("./pages/MoodTracker"));
const GoalsPage = React.lazy(() => import("./pages/GoalsPage"));
const GoalDetailPage = React.lazy(() => import("./pages/GoalDetailPage"));
const Billing = React.lazy(() => import("./pages/Billing"));
const NotificationsPage = React.lazy(() => import("./pages/Notifications"));
const Profile = React.lazy(() => import("./pages/Profile"));
const SearchPage = React.lazy(() => import("./pages/SearchPage"));
const UserManagementPage = React.lazy(() => import("./pages/UserManagement"));
const SettingsPage = React.lazy(() => import("./pages/Settings"));
const TeamSettingsPage = React.lazy(() => import("./pages/TeamSettingsPage"));
const IntegrationsPage = React.lazy(() => import("./pages/IntegrationsPage"));
const OpenAiIntegrationPage = React.lazy(() => import("./pages/integrations/OpenAiIntegrationPage"));
const NavigationSettingsPage = React.lazy(() => import("./pages/NavigationSettingsPage"));
const EmbedPage = React.lazy(() => import("./pages/EmbedPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const PrivacyPolicyPage = React.lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = React.lazy(() => import("./pages/TermsOfServicePage"));
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPasswordPage"));
const GitHubPage = React.lazy(() => import("./pages/integrations/GitHubPage"));
const SlackPage = React.lazy(() => import("./pages/integrations/SlackPage"));
const GoogleDrivePage = React.lazy(() => import("./pages/integrations/GoogleDrivePage"));
const GoogleCalendarPage = React.lazy(() => import("./pages/integrations/GoogleCalendarPage"));

const ProtectedRoute = ({ children, featureId }: { children: React.ReactNode, featureId?: string }) => {
  const { user, loading } = useAuth();
  const { isFeatureEnabled } = useFeatures();
  const location = useLocation();

  if (loading) {
    return <AppSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (featureId && !isFeatureEnabled(featureId)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <>
      <Suspense fallback={<AppSkeleton />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute featureId="projects"><Projects /></ProtectedRoute>} />
          <Route path="/projects/:projectId" element={<ProtectedRoute featureId="projects"><ProjectDetail /></ProtectedRoute>} />
          <Route path="/request" element={<ProtectedRoute featureId="request"><RequestPage /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/mood-tracker" element={<ProtectedRoute featureId="mood-tracker"><MoodTracker /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute featureId="goals"><GoalsPage /></ProtectedRoute>} />
          <Route path="/goals/:slug" element={<ProtectedRoute featureId="goals"><GoalDetailPage /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute featureId="billing"><Billing /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute featureId="notifications"><NotificationsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute featureId="profile"><Profile /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute featureId="search"><SearchPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute featureId="user-management"><UserManagementPage /></ProtectedRoute>} />
          
          <Route path="/settings" element={<ProtectedRoute featureId="settings"><SettingsPage /></ProtectedRoute>} />
          <Route path="/settings/team" element={<ProtectedRoute featureId="settings"><TeamSettingsPage /></ProtectedRoute>} />
          <Route path="/settings/integrations" element={<ProtectedRoute featureId="settings"><IntegrationsPage /></ProtectedRoute>} />
          <Route path="/settings/integrations/openai" element={<ProtectedRoute featureId="settings"><OpenAiIntegrationPage /></ProtectedRoute>} />
          <Route path="/settings/integrations/github" element={<ProtectedRoute featureId="settings"><GitHubPage /></ProtectedRoute>} />
          <Route path="/settings/integrations/slack" element={<ProtectedRoute featureId="settings"><SlackPage /></ProtectedRoute>} />
          <Route path="/settings/integrations/google-drive" element={<ProtectedRoute featureId="settings"><GoogleDrivePage /></ProtectedRoute>} />
          <Route path="/settings/integrations/google-calendar" element={<ProtectedRoute featureId="settings"><GoogleCalendarPage /></ProtectedRoute>} />
          <Route path="/settings/navigation" element={<ProtectedRoute featureId="settings"><NavigationSettingsPage /></ProtectedRoute>} />

          <Route path="/custom" element={<ProtectedRoute><EmbedPage /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;