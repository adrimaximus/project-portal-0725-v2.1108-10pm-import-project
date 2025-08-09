import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FeaturesProvider } from './contexts/FeaturesContext';
import { GoalsProvider } from './context/GoalsContext';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FeaturesProvider>
          <GoalsProvider>
            <App />
          </GoalsProvider>
        </FeaturesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);