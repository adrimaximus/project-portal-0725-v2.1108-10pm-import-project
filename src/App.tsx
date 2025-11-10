import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PortalLayout from '@/components/PortalLayout';

const IndexPage = lazy(() => import('./pages/Index'));
const PropertiesSettingsPage = lazy(() => import('./pages/PropertiesSettingsPage'));
const BillingPropertiesPage = lazy(() => import('./pages/BillingPropertiesPage'));

const PlaceholderPage = ({ title }: { title: string }) => (
  <PortalLayout>
    <h1 className="text-2xl font-bold">{title}</h1>
  </PortalLayout>
);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<IndexPage />} />
            
            <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
            <Route path="/settings/properties" element={<PropertiesSettingsPage />} />
            <Route path="/settings/billing-properties" element={<BillingPropertiesPage />} />
            <Route path="/settings/people-properties" element={<PlaceholderPage title="Contact Properties" />} />
            <Route path="/settings/company-properties" element={<PlaceholderPage title="Company Properties" />} />
            <Route path="/settings/project-properties" element={<PlaceholderPage title="Project Properties" />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;