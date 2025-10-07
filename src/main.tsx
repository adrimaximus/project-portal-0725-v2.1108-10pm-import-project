import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeProvider.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from "@/components/ui/sonner"
import { FeaturesProvider } from './contexts/FeaturesContext.tsx'
import { ConfigProvider } from './contexts/ConfigContext.tsx'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConfigProvider>
          <FeaturesProvider>
            <ThemeProvider defaultTheme="default" defaultMode="system" modeStorageKey="vite-ui-theme-mode" themeStorageKey="vite-ui-theme-palette">
              <App />
              <Toaster />
            </ThemeProvider>
          </FeaturesProvider>
        </ConfigProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)