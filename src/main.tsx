import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter as Router } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext.tsx';
import { GoalsProvider } from './context/GoalsContext.tsx';
import { FeaturesProvider } from './contexts/FeaturesContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <UserProvider>
        <FeaturesProvider>
          <GoalsProvider>
            <App />
          </GoalsProvider>
        </FeaturesProvider>
      </UserProvider>
    </Router>
  </React.StrictMode>,
)