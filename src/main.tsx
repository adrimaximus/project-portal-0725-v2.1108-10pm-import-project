import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FeaturesProvider } from './contexts/FeaturesContext';
import { UserProvider } from './contexts/UserContext';
import { GoalsProvider } from './context/GoalsContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

// IMPORTANT: Replace this with your actual Google Client ID
const GOOGLE_CLIENT_ID = "377151822723-t4qhd4f3jk3vtr2nopv1kolk9qovmhbg.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <UserProvider>
          <FeaturesProvider>
            <GoalsProvider>
              <App />
            </GoalsProvider>
          </FeaturesProvider>
        </UserProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);