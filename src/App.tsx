import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useFeatures } from "./contexts/FeaturesContext";
import { useAuth } from "./contexts/AuthContext";
import React, { useEffect } from "react";
import { toast } from "sonner";

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
import LoadingScreen from "./components/LoadingScreen";
import PeoplePage from "./pages/PeoplePage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import ArticleDetailPage from "./pages/ArticleDetailPage";
import ArticleEditorPage from "./pages/ArticleEditorPage";

const AccessDenied = () => {
  const navigate = useNavigate();
  useEffect(() => {
    toast.error("You do not have permission to access this page.");
    navigate('/dashboard', { replace: true });
  }, [navigate]);
  return <LoadingScreen />;
};

const ProtectedRoute = ({ children, featureId, allowedRoles }: { children: React.ReactNode, featureId?: string, allowedRoles?: string[] }) => {
  const { session, user, loading } = useAuth();
  const { isFeatureEnabled } = useFeatures();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user) {
    return <LoadingScreen />;
  }

  if (featureId && !isFeatureEnabled(featureId)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role || '')) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};

const ADMIN_ROLES = ['admin', 'master admin'];

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute featureId="projects"><Projects /></ProtectedRoute>} />
        <Route path="/projects/:slug" element={<ProtectedRoute featureId="projects"><ProjectDetail /></ProtectedRoute>} />
        <Route path="/request" element={<ProtectedRoute featureId="request"><RequestPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/mood-tracker" element={<ProtectedRoute featureId="mood-tracker"><MoodTracker /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute featureId="goals"><GoalsPage /></ProtectedRoute>} />
        <Route path="/goals/:slug" element={<ProtectedRoute featureId="goals"><GoalDetailPage /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute featureId="billing"><Billing /></ProtectedRoute>} />
        <Route path="/people" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><PeoplePage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute featureId="notifications"><NotificationsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute featureId="profile"><Profile /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute featureId="search"><SearchPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute featureId="user-management" allowedRoles={ADMIN_ROLES}><UserManagementPage /></ProtectedRoute>} />
        <Route path="/users/:id" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
        
        <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBasePage /></ProtectedRoute>} />
        <Route path="/knowledge-base/new" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><ArticleEditorPage /></ProtectedRoute>} />
        <Route path="/knowledge-base/:slug" element={<ProtectedRoute><ArticleDetailPage /></ProtectedRoute>} />
        <Route path="/knowledge-base/:slug/edit" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><ArticleEditorPage /></ProtectedRoute>} />

        <Route path="/settings" element={<ProtectedRoute featureId="settings" allowedRoles={ADMIN_ROLES}><SettingsPage /></ProtectedRoute>} />
        <Route path="/settings/team" element={<ProtectedRoute featureId="settings" allowedRoles={ADMIN_ROLES}><TeamSettingsPage /></ProtectedRoute>} />
        <Route path="/settings/integrations" element={<ProtectedRoute featureId="settings" allowedRoles={ADMIN_ROLES}><IntegrationsPage /></ProtectedRoute>} />
        <Route path="/settings/integrations/openai" element={<ProtectedRoute featureId="settings" allowedRoles={ADMIN_ROLES}><OpenAiIntegrationPage /></ProtectedRoute>} />
        <Route path="/settings/integrations/github" element={<ProtectedRoute featureId="settings" allowedRoles={ADMIN_ROLES}><GitHubPage /></ProtectedRoute>} />
        <Route path="/settings/integrations/slack" element={<ProtectedRoute featureId="settings" allowedRoles={ADMIN_ROLES}><SlackPage /></ProtectedRoute>} />
        <Route path="/settings/integrations/google-drive" element={<ProtectedRoute featureId="settings" allowedRoles={ADMIN_ROLES}><GoogleDrivePage /></ProtectedRoute>} />
        <Route path="/settings/integrations/google-calendar" element={<ProtectedRoute featureId="settings" allowedRoles={ADMIN_ROLES}><GoogleCalendarPage /></ProtectedRoute>} />
        <Route path="/settings/navigation" element={<ProtectedRoute featureId="settings" allowedRoles={ADMIN_ROLES}><NavigationSettingsPage /></ProtectedRoute>} />

        <Route path="/custom" element={<ProtectedRoute><EmbedPage /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;