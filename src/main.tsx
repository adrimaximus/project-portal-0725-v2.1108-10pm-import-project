import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter as Router } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext.tsx';
import { GoalsProvider } from './context/GoalsContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <UserProvider>
        <GoalsProvider>
          <App />
        </GoalsProvider>
      </UserProvider>
    </Router>
  </React.StrictMode>,
)