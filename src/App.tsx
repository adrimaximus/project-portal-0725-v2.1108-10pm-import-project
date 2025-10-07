import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { FeaturesProvider } from './contexts/FeaturesContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRedirect from './components/AuthRedirect';
import { Toaster } from '@/components/ui/toaster';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const UpdatePasswordPage = lazy(() => import('./pages/UpdatePasswordPage'));
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
const WorkspaceSettingsPage = lazy(() => import('./pages/WorkspaceSettingsPage'));
const TeamSettingsPage = lazy(() => import('./pages/TeamSettingsPage'));
const TagsSettingsPage = lazy(() => import('./pages/TagsSettingsPage'));
const NavigationSettingsPage = lazy(() => import('./pages/NavigationSettingsPage'));
const MultiPageViewer = lazy(() => import('./pages/MultiPageViewer'));
const ThemeSettingsPage = lazy(() => import('./pages/ThemeSettingsPage'));

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <FeaturesProvider>
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
              <Routes>
                <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
                <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
                <Route path="/forgot-password" element={<AuthRedirect><ForgotPasswordPage /></AuthRedirect>} />
                <Route path="/update-password" element={<AuthRedirect><UpdatePasswordPage /></AuthRedirect>} />
                
                <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
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
                <Route path="/people/:id" element={<ProtectedRoute><PersonDetailPage /></ProtectedRoute>} />
                <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBasePage /></ProtectedRoute>} />
                <Route path="/kb/folder/:slug" element={<ProtectedRoute><KnowledgeBaseFolderPage /></ProtectedRoute>} />
                <Route path="/kb/article/:slug" element={<ProtectedRoute><KnowledgeBaseArticlePage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="/settings/workspace" element={<ProtectedRoute><WorkspaceSettingsPage /></ProtectedRoute>} />
                <Route path="/settings/team" element={<ProtectedRoute><TeamSettingsPage /></ProtectedRoute>} />
                <Route path="/settings/tags" element={<ProtectedRoute><TagsSettingsPage /></ProtectedRoute>} />
                <Route path="/settings/navigation" element={<ProtectedRoute><NavigationSettingsPage /></ProtectedRoute>} />
                <Route path="/settings/theme" element={<ProtectedRoute><ThemeSettingsPage /></ProtectedRoute>} />
                <Route path="/multipage/:slug" element={<ProtectedRoute><MultiPageViewer /></ProtectedRoute>} />
                <Route path="/multipage/:slug/:itemSlug" element={<ProtectedRoute><MultiPageViewer /></ProtectedRoute>} />
              </Routes>
            </Suspense>
            <Toaster />
          </FeaturesProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;