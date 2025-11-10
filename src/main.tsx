import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ThemeProvider } from './contexts/ThemeProvider.tsx'
import { Toaster } from 'sonner'
import { BrowserRouter as Router } from 'react-router-dom';
import SafeLocalStorage from './lib/localStorage.ts';

// Automatically clean up expired items from local storage on startup
SafeLocalStorage.cleanup();

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ThemeProvider>
            <App />
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  </React.StrictMode>,
)