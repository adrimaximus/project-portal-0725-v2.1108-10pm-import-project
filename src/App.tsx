import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Index from './pages/Index';
import NotFoundPage from './pages/NotFoundPage';
import PublicProjectPage from './pages/PublicProjectPage';

// Lazy load the portal pages
const PortalLayout = lazy(() => import('./components/PortalLayout'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const RequestPage = lazy(() => import('./pages/RequestPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const MoodTrackerPage = lazy(() => import('./pages/MoodTrackerPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const GoalDetailPage = lazy(() => import('./pages/GoalDetailPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const PeoplePage = lazy(() => import('./pages/PeoplePage'));
const PersonDetailPage = lazy(() => import('./pages/PersonDetailPage'));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage'));
const KnowledgeBaseFolderPage = lazy(() => import('./pages/KnowledgeBaseFolderPage'));
const KnowledgeBaseArticlePage = lazy(() => import('./pages/KnowledgeBaseArticlePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AccountSettingsPage = lazy(() => import('./pages/AccountSettingsPage'));
const AppearanceSettingsPage = lazy(() => import('./pages/AppearanceSettingsPage'));
const NotificationsSettingsPage = lazy(() => import('./pages/NotificationsSettingsPage'));
const TeamSettingsPage = lazy(() => import('./pages/TeamSettingsPage'));
const RolesAndPermissionsPage = lazy(() => import('./pages/RolesAndPermissionsPage'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage'));
const GoogleDriveIntegrationPage = lazy(() => import('./pages/integrations/GoogleDriveIntegrationPage'));
const GoogleCalendarIntegrationPage = lazy(() => import('./pages/integrations/GoogleCalendarIntegrationPage'));
const OpenAIIntegrationPage = lazy(() => import('./pages/integrations/OpenAIIntegrationPage'));
const WBIZTOOLIntegrationPage = lazy(() => import('./pages/integrations/WBIZTOOLIntegrationPage'));
const EmailitIntegrationPage = lazy(() => import('./pages/integrations/EmailitIntegrationPage'));
const SpeechToTextIntegrationPage = lazy(() => import('./pages/integrations/SpeechToTextIntegrationPage'));
const MultiPageViewer = lazy(() => import('./pages/MultiPageViewer'));
const MultiEmbedItemPage = lazy(() => import('./pages/MultiEmbedItemPage'));

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/p/:slug" element={<PublicProjectPage />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route path="/projects/:slug" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
            <Route path="/request" element={<ProtectedRoute><RequestPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/mood-tracker" element={<ProtectedRoute><MoodTrackerPage /></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
            <Route path="/goals/:slug" element={<ProtectedRoute><GoalDetailPage /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
            <Route path="/people" element={<ProtectedRoute><PeoplePage /></ProtectedRoute>} />
            <Route path="/people/:slug" element={<ProtectedRoute><PersonDetailPage /></ProtectedRoute>} />
            <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBasePage /></ProtectedRoute>} />
            <Route path="/kb/:folderSlug" element={<ProtectedRoute><KnowledgeBaseFolderPage /></ProtectedRoute>} />
            <Route path="/kb/:folderSlug/:articleSlug" element={<ProtectedRoute><KnowledgeBaseArticlePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/account" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />
            <Route path="/settings/appearance" element={<ProtectedRoute><AppearanceSettingsPage /></ProtectedRoute>} />
            <Route path="/settings/notifications" element={<ProtectedRoute><NotificationsSettingsPage /></ProtectedRoute>} />
            <Route path="/settings/team" element={<ProtectedRoute><TeamSettingsPage /></ProtectedRoute>} />
            <Route path="/settings/roles" element={<ProtectedRoute><RolesAndPermissionsPage /></ProtectedRoute>} />
            <Route path="/settings/integrations" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
            <Route path="/settings/integrations/google-drive" element={<ProtectedRoute><GoogleDriveIntegrationPage /></ProtectedRoute>} />
            <Route path="/settings/integrations/google-calendar" element={<ProtectedRoute><GoogleCalendarIntegrationPage /></ProtectedRoute>} />
            <Route path="/settings/integrations/openai" element={<ProtectedRoute><OpenAIIntegrationPage /></ProtectedRoute>} />
            <Route path="/settings/integrations/wbiztool" element={<ProtectedRoute><WBIZTOOLIntegrationPage /></ProtectedRoute>} />
            <Route path="/settings/integrations/emailit" element={<ProtectedRoute><EmailitIntegrationPage /></ProtectedRoute>} />
            <Route path="/settings/integrations/speech-to-text" element={<ProtectedRoute><SpeechToTextIntegrationPage /></ProtectedRoute>} />
            <Route path="/multipage/:slug" element={<ProtectedRoute><MultiPageViewer /></ProtectedRoute>} />
            <Route path="/multipage/:navSlug/:itemSlug" element={<ProtectedRoute><MultiEmbedItemPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;