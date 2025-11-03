import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/layouts/PortalLayout';
import AuthLayout from '@/components/layouts/AuthLayout';
import { TooltipProvider } from '@/components/ui/tooltip';
import FullPageSpinner from './components/FullPageSpinner';

const LoginPage = lazy(() => import('@/pages/auth/Login'));
const RegisterPage = lazy(() => import('@/pages/auth/Register'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPassword'));
const UpdatePasswordPage = lazy(() => import('@/pages/auth/UpdatePassword'));
const DashboardPage = lazy(() => import('@/pages/Dashboard'));
const ProjectsPage = lazy(() => import('@/pages/projects/Projects'));
const ProjectDetailPage = lazy(() => import('@/pages/projects/ProjectDetail'));
const PeoplePage = lazy(() => import('@/pages/people/People'));
const PersonDetailPage = lazy(() => import('@/pages/people/PersonDetail'));
const SettingsPage = lazy(() => import('@/pages/settings/Settings'));
const ProfileSettingsPage = lazy(() => import('@/pages/settings/Profile'));
const NotificationsPage = lazy(() => import('@/pages/settings/NotificationsPage'));
const ChatPage = lazy(() => import('@/pages/chat/Chat'));
const GoalsPage = lazy(() => import('@/pages/goals/Goals'));
const GoalDetailPage = lazy(() => import('@/pages/goals/GoalDetail'));
const KnowledgeBasePage = lazy(() => import('@/pages/kb/KnowledgeBase'));
const ArticlePage = lazy(() => import('@/pages/kb/Article'));
const MultiEmbedPage = lazy(() => import('@/pages/multiembed/MultiEmbedPage'));
const BillingPage = lazy(() => import('@/pages/billing/Billing'));

interface AuthenticatedRouteProps {
  children: React.ReactNode;
}

const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Router>
          <Suspense fallback={<FullPageSpinner />}>
            <Routes>
              <Route path="/" element={<AuthLayout />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="update-password" element={<UpdatePasswordPage />} />
              </Route>

              <Route 
                path="/"
                element={
                  <AuthenticatedRoute>
                    <PortalLayout />
                  </AuthenticatedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:slug" element={<ProjectDetailPage />} />
                <Route path="people" element={<PeoplePage />} />
                <Route path="people/:slug" element={<PersonDetailPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="settings/profile" element={<ProfileSettingsPage />} />
                <Route path="settings/notifications" element={<NotificationsPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="chat/:conversationId" element={<ChatPage />} />
                <Route path="goals" element={<GoalsPage />} />
                <Route path="goals/:slug" element={<GoalDetailPage />} />
                <Route path="knowledge-base" element={<KnowledgeBasePage />} />
                <Route path="knowledge-base/:folderSlug/:articleSlug" element={<ArticlePage />} />
                <Route path="multipage/:slug" element={<MultiEmbedPage />} />
                <Route path="multipage/:slug/:itemSlug" element={<MultiEmbedPage />} />
                <Route path="billing" element={<BillingPage />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
        <Toaster />
      </TooltipProvider>
    </AuthProvider>
  );
};

export default App;