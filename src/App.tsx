import { Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';

import IndexPage from './pages/Index';
import LoginPage from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ProjectsPage from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ChatPage from './pages/Chat';
import GoalsPage from './pages/Goals';
import GoalDetailPage from './pages/GoalDetail';
import CalendarPage from './pages/Calendar';
import SettingsPage from './pages/Settings';

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><IndexPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/projects/:slug" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
        <Route path="/goals/:slug" element={<ProtectedRoute><GoalDetailPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;