import { Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import RequestPage from './pages/Request';
import ChatPage from './pages/ChatPage';
import MoodTracker from './pages/MoodTracker';
import GoalsPage from './pages/GoalsPage';
import GoalDetailPage from './pages/GoalDetailPage';
import Billing from './pages/Billing';
import NotificationsPage from './pages/Notifications';
import Profile from './pages/Profile';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/Settings';
import TeamSettingsPage from './pages/TeamSettingsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import OpenAiIntegrationPage from './pages/integrations/OpenAiIntegrationPage';
import NavigationSettingsPage from './pages/NavigationSettingsPage';
import EmbedPage from './pages/EmbedPage';
import UserManagementPage from './pages/UserManagement';
import NotFound from './pages/NotFound';
import { Toaster } from "@/components/ui/sonner";
import InvoiceDetail from './pages/InvoiceDetail';
import Chat from './pages/Chat';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/mood-tracker" element={<MoodTracker />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/:id" element={<GoalDetailPage />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/team" element={<TeamSettingsPage />} />
        <Route path="/settings/integrations" element={<IntegrationsPage />} />
        <Route path="/settings/integrations/openai" element={<OpenAiIntegrationPage />} />
        <Route path="/settings/navigation" element={<NavigationSettingsPage />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/custom" element={<EmbedPage />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;