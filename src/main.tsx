import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FeaturesProvider } from './contexts/FeaturesContext';
import { UserProvider } from './contexts/UserContext';
import { GoalsProvider } from './context/GoalsContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { Toaster } from "@/components/ui/sonner";
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider>
        <FeaturesProvider>
          <GoalsProvider>
            <ProjectProvider>
              <App />
              <Toaster />
            </ProjectProvider>
          </GoalsProvider>
        </FeaturesProvider>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);