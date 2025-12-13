import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@/contexts/ThemeProvider";
import PortalLayout from './components/PortalLayout';

// Lazy load pages
const PropertiesSettingsPage = lazy(() => import('@/pages/PropertiesSettingsPage'));
const ExpensePropertiesPage = lazy(() => import('@/pages/ExpensePropertiesPage'));
const ProjectStatusesPage = lazy(() => import('@/pages/settings/ProjectStatusesPage'));
const BillingPropertiesPage = lazy(() => import('@/pages/BillingPropertiesPage'));
const IndexPage = lazy(() => import('@/pages/Index'));


const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
              <Routes>
                <Route path="/" element={<IndexPage />} />

                {/* Settings Routes */}
                <Route path="/settings/properties" element={<PropertiesSettingsPage />} />
                <Route path="/settings/expense-properties" element={<ExpensePropertiesPage />} />
                <Route path="/settings/project-statuses" element={<ProjectStatusesPage />} />
                <Route path="/settings/billing-properties" element={<BillingPropertiesPage />} />

                {/* Add other main routes here */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;