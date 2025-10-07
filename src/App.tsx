import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { FeaturesProvider } from '@/contexts/FeaturesContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import SettingsPage from '@/pages/SettingsPage';
import { ThemeProvider } from '@/contexts/ThemeContext';
import PortalLayout from '@/components/PortalLayout';

const queryClient = new QueryClient();

// A placeholder for other pages.
const PlaceholderPage = ({ title }: { title: string }) => (
  <PortalLayout>
    <div className="p-4">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  </PortalLayout>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <FeaturesProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Navigate to="/settings" />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/workspace" element={<PlaceholderPage title="Workspace Settings" />} />
              </Routes>
            </Router>
            <Toaster />
          </FeaturesProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;