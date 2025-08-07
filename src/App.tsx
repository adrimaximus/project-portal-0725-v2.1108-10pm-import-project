import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useFeatures } from "./contexts/FeaturesContext";
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
import GoogleCalendarPage from "./pages/integrations/GoogleCalendarPage";
import NavigationSettingsPage from "./pages/NavigationSettingsPage";
import EmbedPage from "./pages/EmbedPage";
import NotFound from "./pages/NotFound";

const ProtectedRoute = ({ featureId, element }: { featureId: string, element: React.ReactNode }) => {
  const { isFeatureEnabled } = useFeatures();
  return isFeatureEnabled(featureId) ? <>{element}</> : <Navigate to="/" replace />;
};

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/projects" element={<ProtectedRoute featureId="projects" element={<Projects />} />} />
        <Route path="/projects/:projectId" element={<ProtectedRoute featureId="projects" element={<ProjectDetail />} />} />
        <Route path="/request" element={<ProtectedRoute featureId="request" element={<RequestPage />} />} />
        <Route path="/chat" element={<ProtectedRoute featureId="chat" element={<ChatPage />} />} />
        <Route path="/mood-tracker" element={<ProtectedRoute featureId="mood-tracker" element={<MoodTracker />} />} />
        <Route path="/goals" element={<ProtectedRoute featureId="goals" element={<GoalsPage />} />} />
        <Route path="/goals/:goalId" element={<ProtectedRoute featureId="goals" element={<GoalDetailPage />} />} />
        <Route path="/billing" element={<ProtectedRoute featureId="billing" element={<Billing />} />} />
        <Route path="/notifications" element={<ProtectedRoute featureId="notifications" element={<NotificationsPage />} />} />
        <Route path="/profile" element={<ProtectedRoute featureId="profile" element={<Profile />} />} />
        <Route path="/search" element={<ProtectedRoute featureId="search" element={<SearchPage />} />} />
        <Route path="/users" element={<ProtectedRoute featureId="user-management" element={<UserManagementPage />} />} />
        
        <Route path="/settings" element={<ProtectedRoute featureId="settings" element={<SettingsPage />} />} />
        <Route path="/settings/team" element={<ProtectedRoute featureId="settings" element={<TeamSettingsPage />} />} />
        <Route path="/settings/integrations" element={<ProtectedRoute featureId="settings" element={<IntegrationsPage />} />} />
        <Route path="/settings/integrations/openai" element={<ProtectedRoute featureId="settings" element={<OpenAiIntegrationPage />} />} />
        <Route path="/settings/integrations/google-calendar" element={<ProtectedRoute featureId="settings" element={<GoogleCalendarPage />} />} />
        <Route path="/settings/navigation" element={<ProtectedRoute featureId="settings" element={<NavigationSettingsPage />} />} />

        <Route path="/custom" element={<EmbedPage />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;