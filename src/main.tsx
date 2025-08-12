import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from "@/components/ui/sonner"
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error("FATAL: Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || ""}>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)