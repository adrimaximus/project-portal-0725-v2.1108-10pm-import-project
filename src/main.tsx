import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { FeaturesProvider } from './contexts/FeaturesContext'
import { Toaster } from "@/components/ui/sonner"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeProvider'
import { ConfigProvider } from 'antd';

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
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
    </HashRouter>
  </React.StrictMode>,
)