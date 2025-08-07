import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppLayout from "./components/AppLayout";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import RequestPage from "./pages/Request";
import ChatPage from "./pages/ChatPage";
import MoodTracker from "./pages/MoodTracker";
import GoalsPage from "./pages/GoalsPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import GoalEditPage from "./pages/GoalEditPage";
import Billing from "./pages/Billing";
import NotificationsPage from "./pages/Notifications";
import Profile from "./pages/Profile";
import SearchPage from "./pages/SearchPage";
import SettingsPage from "./pages/Settings";
import TeamSettingsPage from "./pages/TeamSettingsPage";
import NavigationSettingsPage from "./pages/NavigationSettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import OpenAiIntegrationPage from "./pages/integrations/OpenAiIntegrationPage";
import { GoogleCalendarPage } from "./pages/integrations/GoogleCalendarPage";
import EmbedPage from "./pages/EmbedPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import UserManagementPage from "./pages/UserManagement";
import SettingsLayout from "./components/settings/SettingsLayout";

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/mood-tracker" element={<MoodTracker />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/goals/:goalId" element={<GoalDetailPage />} />
          <Route path="/goals/edit/:id" element={<GoalEditPage />} />
          <Route path="/goals/new" element={<GoalEditPage />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<SearchPage />} />
          
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<SettingsPage />} />
            <Route path="team" element={<TeamSettingsPage />} />
            <Route path="navigation" element={<NavigationSettingsPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="integrations/openai" element={<OpenAiIntegrationPage />} />
            <Route path="integrations/google-calendar" element={<GoogleCalendarPage />} />
          </Route>

          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/custom" element={<EmbedPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;