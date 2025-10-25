"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import BillingPage from "@/pages/Billing";
import ChatPage from "@/pages/ChatPage";
import DashboardPage from "@/pages/DashboardPage";
import GoalPage from "@/pages/GoalPage";
import GoalsPage from "@/pages/GoalsPage";
import GoogleCalendarIntegrationPage from "@/pages/integrations/GoogleCalendarIntegrationPage";
import GoogleDriveIntegrationPage from "@/pages/integrations/GoogleDriveIntegrationPage";
import SpeechToTextPage from "@/pages/integrations/SpeechToTextPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import KnowledgeBaseArticlePage from "@/pages/KnowledgeBaseArticlePage";
import KnowledgeBasePage from "@/pages/KnowledgeBasePage";
import LoginPage from "@/pages/LoginPage";
import MoodTrackerPage from "@/pages/MoodTrackerPage";
import MultiEmbedPage from "@/pages/MultiEmbedPage";
import PeoplePage from "@/pages/PeoplePage";
import PersonDetailPage from "@/pages/PersonDetailPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ProjectsPage from "@/pages/ProjectsPage";
import RequestPage from "@/pages/RequestPage";
import SettingsPage from "@/pages/SettingsPage";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:slug" element={<ProjectDetailPage />} />
              <Route path="/request" element={<RequestPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/chat/:conversationId" element={<ChatPage />} />
              <Route path="/mood-tracker" element={<MoodTrackerPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/goals/:slug" element={<GoalPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/people" element={<PeoplePage />} />
              <Route path="/people/:slug" element={<PersonDetailPage />} />
              <Route
                path="/knowledge-base"
                element={<KnowledgeBasePage />}
              />
              <Route
                path="/knowledge-base/:folderSlug"
                element={<KnowledgeBasePage />}
              />
              <Route
                path="/knowledge-base/:folderSlug/:articleSlug"
                element={<KnowledgeBaseArticlePage />}
              />
              <Route path="/settings" element={<SettingsPage />} />
              <Route
                path="/settings/integrations"
                element={<IntegrationsPage />}
              />
              <Route
                path="/settings/integrations/google-drive"
                element={<GoogleDriveIntegrationPage />}
              />
              <Route
                path="/settings/integrations/google-calendar"
                element={<GoogleCalendarIntegrationPage />}
              />
              <Route
                path="/settings/integrations/speech-to-text"
                element={<SpeechToTextPage />}
              />
              <Route path="/multipage/:slug" element={<MultiEmbedPage />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;