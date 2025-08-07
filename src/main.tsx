import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FeaturesProvider } from './contexts/FeaturesContext';
import { UserProvider } from './contexts/UserContext';
import { GoalsProvider } from './context/GoalsContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './config';
import { AuthProvider } from './hooks/useAuth';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <UserProvider>
          <AuthProvider>
            <FeaturesProvider>
              <GoalsProvider>
                <App />
              </GoalsProvider>
            </FeaturesProvider>
          </AuthProvider>
        </UserProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);