import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import BillingPage from "./pages/BillingPage";
import ChatPage from "./pages/ChatPage";
import DashboardPage from "./pages/DashboardPage";
import GoalsPage from "./pages/GoalsPage";
import GoalDetailPage from "./pages/GoalDetailPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import MoodTrackerPage from "./pages/MoodTrackerPage";
import PeoplePage from "./pages/PeoplePage";
import PersonDetailPage from "./pages/PersonDetailPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import RequestPage from "./pages/RequestPage";
import SettingsPage from "./pages/SettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import WbiztoolPage from "./pages/integrations/WbiztoolPage";
import GoogleCalendarPage from "./pages/integrations/GoogleCalendarPage";
import OpenAiIntegrationPage from "./pages/integrations/OpenAiIntegrationPage";
import GoogleDrivePage from "./pages/integrations/GoogleDrivePage";
import ContactPropertiesPage from "./pages/ContactPropertiesPage";
import MultiEmbedPage from "./pages/MultiEmbedPage";
import KnowledgeBaseFolderPage from "./pages/KnowledgeBaseFolderPage";
import KnowledgeBaseArticlePage from "./pages/KnowledgeBaseArticlePage";
import CompanyDetailPage from "./pages/CompanyDetailPage";
import EmailItPage from "./pages/integrations/EmailItPage";

function App() {
  const location = useLocation();

  return (
    <TooltipProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route index element={<DashboardPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:slug" element={<ProjectDetailPage />} />
          <Route path="/tasks" element={<ProjectsPage />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:conversationId" element={<ChatPage />} />
          <Route path="/mood-tracker" element={<MoodTrackerPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/goals/:slug" element={<GoalDetailPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/people/:id" element={<PersonDetailPage />} />
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
          <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="/knowledge-base/:folderSlug" element={<KnowledgeBaseFolderPage />} />
          <Route path="/knowledge-base/:folderSlug/:articleSlug" element={<KnowledgeBaseArticlePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/integrations" element={<IntegrationsPage />} />
          <Route path="/settings/integrations/wbiztool" element={<WbiztoolPage />} />
          <Route path="/settings/integrations/google-calendar" element={<GoogleCalendarPage />} />
          <Route path="/settings/integrations/openai" element={<OpenAiIntegrationPage />} />
          <Route path="/settings/integrations/google-drive" element={<GoogleDrivePage />} />
          <Route path="/settings/integrations/emailit" element={<EmailItPage />} />
          <Route path="/settings/people-properties" element={<ContactPropertiesPage />} />
          <Route path="/multipage/:slug" element={<MultiEmbedPage />} />
        </Routes>
      </AnimatePresence>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;