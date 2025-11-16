import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import AuthProvider from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// NOTE: This routing file has been updated. 
// If you have other pages, please ensure their routes are included here.

const queryClient = new QueryClient();

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/Index'));
const ExpensePage = lazy(() => import('./pages/ExpensePage'));
const TagsSettingsPage = lazy(() => import('./pages/TagsSettingsPage'));

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/expense" element={<ProtectedRoute><ExpensePage /></ProtectedRoute>} />
              <Route path="/settings/tags" element={<ProtectedRoute><TagsSettingsPage /></ProtectedRoute>} />

              {/* Add your other protected routes here */}

            </Routes>
          </Suspense>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;