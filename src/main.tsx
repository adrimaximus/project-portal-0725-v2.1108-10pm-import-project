import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FeaturesProvider } from './contexts/FeaturesContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "YOUR_CLIENT_ID_HERE") {
  console.error("======================================================================");
  console.error("ERROR: Google Client ID is not configured correctly.");
  console.error("Please ensure VITE_GOOGLE_CLIENT_ID is set in your .env file and you have rebuilt the application.");
  console.error("Current value:", GOOGLE_CLIENT_ID);
  console.error("======================================================================");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || ""}>
        <AuthProvider>
          <FeaturesProvider>
            <App />
          </FeaturesProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);