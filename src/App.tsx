import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useFeatures } from "./contexts/FeaturesContext";
import { useUser } from "./contexts/UserContext";
import React from "react";

import IndexPage from "./pages/Index";
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
import SettingsPage from "./pages/Settings";
import TeamSettingsPage from "./pages/TeamSettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import OpenAiIntegrationPage from "./pages/integrations/OpenAiIntegrationPage";
import NavigationSettingsPage from "./pages/NavigationSettingsPage";
import EmbedPage from "./pages/EmbedPage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import GitHubPage from "./pages/integrations/GitHubPage";
import SlackPage from "./pages/integrations/SlackPage";
import GoogleDrivePage from "./pages/integrations/GoogleDrivePage";
import GoogleCalendarPage from "./pages/integrations/GoogleCalendarPage";

const ProtectedRoute = ({ children, featureId }: { children: React.ReactNode, featureId?: string }) => {
  const { user, isLoading } = useUser();
  const { isFeatureEnabled } = useFeatures();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (featureId && !isFeatureEnabled(featureId)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={<ProtectedRoute><IndexPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute featureId="projects"><Projects /></ProtectedRoute>} />
        <Route path="/projects/:projectId" element={<ProtectedRoute featureId="projects"><ProjectDetail /></ProtectedRoute>} />
        <Route path="/request" element={<ProtectedRoute featureId="request"><RequestPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute featureId="chat"><ChatPage /></ProtectedRoute>} />
        <Route path="/mood-tracker" element={<ProtectedRoute featureId="mood-tracker"><MoodTracker /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute featureId="goals"><GoalsPage /></ProtectedRoute>} />
        <Route path="/goals/:goalId" element={<ProtectedRoute featureId="goals"><GoalDetailPage /></ProtectedRoute>} />
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
      <Toaster />
    </>
  );
}

export default App;