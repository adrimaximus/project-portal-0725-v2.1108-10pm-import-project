import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './providers/AuthProvider';
import { FeaturesProvider } from './contexts/FeaturesContext';
import { GoalsProvider } from './context/GoalsContext';
import './index.css';

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