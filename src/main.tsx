import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { FeaturesProvider } from './contexts/FeaturesContext'
import { Toaster } from "@/components/ui/sonner"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeProvider'
import { ConfigProvider } from 'antd';
import { GoogleOAuthProvider } from '@react-oauth/google';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on auth errors or RLS errors
        if (error?.message?.includes('JWT') || 
            error?.message?.includes('auth') || 
            error?.message?.includes('403') ||
            error?.message?.includes('Forbidden')) {
          return false;
        }
        return failureCount < 2; // Reduced retry count
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default browser behavior
  event.preventDefault();
});

// Global error handler for JavaScript errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Don't prevent default behavior for regular errors
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error("Google Client ID is not set. Please add VITE_GOOGLE_CLIENT_ID to your environment variables.");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || ""}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FeaturesProvider>
              <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
                <ConfigProvider
                  theme={{
                    token: {
                      colorPrimary: '#1E293B', // slate-800
                      colorInfo: '#1E293B',
                    },
                  }}
                >
                  <App />
                </ConfigProvider>
                <Toaster />
              </ThemeProvider>
            </FeaturesProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)