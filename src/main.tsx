import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FeaturesProvider } from './contexts/FeaturesContext';
import { UserProvider } from './contexts/UserContext';
import { GoalsProvider } from './context/GoalsContext';
import './index.css';
import 'antd/dist/reset.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider>
        <FeaturesProvider>
          <GoalsProvider>
            <App />
          </GoalsProvider>
        </FeaturesProvider>
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);