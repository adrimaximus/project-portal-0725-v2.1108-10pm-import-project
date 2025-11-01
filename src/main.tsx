import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionContextProvider } from './contexts/SessionContext.tsx'
import { Toaster } from 'sonner'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider>
        <App />
        <Toaster />
      </SessionContextProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)