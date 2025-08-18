import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { FeaturesProvider } from './contexts/FeaturesContext'
import { Toaster } from "@/components/ui/sonner"
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error("FATAL: Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.");
}

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={googleClientId || ""}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FeaturesProvider>
              <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <App />
                <Toaster />
              </ThemeProvider>
            </FeaturesProvider>
          </AuthProvider>
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)