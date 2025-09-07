import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import FullPageSpinner from './components/FullPageSpinner';

const queryClient = new QueryClient();

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PeoplePage = lazy(() => import('./pages/PeoplePage'));
const PersonDetailPage = lazy(() => import('./pages/PersonDetailPage'));
const TagsSettingsPage = lazy(() => import('./pages/Settings/TagsSettingsPage'));

// A wrapper for protected routes
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <FullPageSpinner />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<FullPageSpinner />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/people" element={<ProtectedRoute><PeoplePage /></ProtectedRoute>} />
                <Route path="/people/:id" element={<ProtectedRoute><PersonDetailPage /></ProtectedRoute>} />
                <Route path="/settings/tags" element={<ProtectedRoute><TagsSettingsPage /></ProtectedRoute>} />
                
                {/* Default route */}
                <Route path="*" element={<Navigate to="/people" replace />} />
              </Routes>
            </Suspense>
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;