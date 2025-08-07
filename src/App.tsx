import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Request from "./pages/Request";
import ChatPage from "./pages/ChatPage";
import MoodTracker from "./pages/MoodTracker";
import GoalsPage from "./pages/GoalsPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import TeamSettingsPage from "./pages/TeamSettingsPage";
import NavigationSettingsPage from "./pages/NavigationSettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import OpenAiIntegrationPage from "./pages/integrations/OpenAiIntegrationPage";
import GoogleCalendarPage from "./pages/integrations/GoogleCalendarPage";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import SearchPage from "./pages/SearchPage";
import UserManagement from "./pages/UserManagement";
import EmbedPage from "./pages/EmbedPage";
import NotFound from "./pages/NotFound";
import GoalEditPage from "./pages/GoalEditPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:projectId" element={<ProjectDetail />} />
      <Route path="/request" element={<Request />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/mood-tracker" element={<MoodTracker />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/goals/:goalId" element={<GoalDetailPage />} />
      <Route path="/goals/new" element={<GoalEditPage />} />
      <Route path="/goals/edit/:id" element={<GoalEditPage />} />
      <Route path="/billing" element={<Billing />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/settings/team" element={<TeamSettingsPage />} />
      <Route path="/settings/navigation" element={<NavigationSettingsPage />} />
      <Route path="/settings/integrations" element={<IntegrationsPage />} />
      <Route path="/settings/integrations/openai" element={<OpenAiIntegrationPage />} />
      <Route path="/settings/integrations/google-calendar" element={<GoogleCalendarPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/users" element={<UserManagement />} />
      <Route path="/custom" element={<EmbedPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;