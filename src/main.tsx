import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FeaturesProvider } from './contexts/FeaturesContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from './integrations/supabase/client';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleOAuthProvider } from '@react-oauth/google';

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error("Google Client ID is not defined. Google Calendar integration will not work.");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ""}>
      <BrowserRouter>
        <SessionContextProvider supabaseClient={supabase}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <FeaturesProvider>
                <TooltipProvider>
                  <Toaster />
                  <App />
                </TooltipProvider>
              </FeaturesProvider>
            </AuthProvider>
          </QueryClientProvider>
        </SessionContextProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);