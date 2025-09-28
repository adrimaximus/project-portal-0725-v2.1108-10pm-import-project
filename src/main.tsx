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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          return false;
        }
        return failureCount < 3;
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
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
  </React.StrictMode>,
)