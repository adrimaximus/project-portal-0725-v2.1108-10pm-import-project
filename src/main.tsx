import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { GoalsProvider } from './context/GoalsContext';
import { SettingsProvider } from './context/SettingsContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <GoalsProvider>
          <App />
        </GoalsProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>
);