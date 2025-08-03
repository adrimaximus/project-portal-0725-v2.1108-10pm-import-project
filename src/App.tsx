import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Routes } from "react-router-dom";

import Billing from "./pages/Billing";
import ChatPage from "./pages/ChatPage";
import EmbedPage from "./pages/EmbedPage";
import TeamSettingsPage from "./pages/TeamSettingsPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import GoalsPage from "./pages/GoalsPage";
import Index from "./pages/Index";
import IntegrationsPage from "./pages/IntegrationsPage";
import MoodTracker from "./pages/MoodTracker";
import NotFound from "./pages/NotFound";
import NotificationsPage from "./pages/Notifications";
import Profile from "./pages/Profile";
import ProjectDetail from "./pages/ProjectDetail";
import Projects from "./pages/Projects";
import RequestPage from "./pages/Request";
import SearchPage from "./pages/SearchPage";
import SettingsPage from "./pages/Settings";
import UserManagementPage from "./pages/UserManagement";
import NavigationSettingsPage from "./pages/NavigationSettingsPage";

function App() {
  return (
    <TooltipProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/mood-tracker" element={<MoodTracker />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/:goalId" element={<GoalDetailPage />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/settings/team"
          element={<TeamSettingsPage />}
        />
        <Route path="/settings/integrations" element={<IntegrationsPage />} />
        <Route path="/settings/navigation" element={<NavigationSettingsPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/custom" element={<EmbedPage />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;