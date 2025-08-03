import { Routes, Route, Navigate } from 'react-router-dom';

import Index from './pages/Index';
import Request from './pages/Request';
import ChatPage from './pages/ChatPage';
import MoodTracker from './pages/MoodTracker';
import GoalsPage from './pages/GoalsPage';
import GoalDetailPage from './pages/GoalDetailPage';
import Billing from './pages/Billing';
import Notifications from './pages/Notifications';
import ProjectDetail from './pages/ProjectDetail';
import Projects from './pages/Projects';
import Profile from './pages/Profile';
import EmbedPage from './pages/EmbedPage';
import SettingsPage from './pages/Settings';
import SearchPage from './pages/SearchPage';
import NotFound from './pages/NotFound';
import FeatureSettingsPage from './pages/FeatureSettingsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:projectId" element={<ProjectDetail />} />
      <Route path="/request" element={<Request />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/mood-tracker" element={<MoodTracker />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/goals/:goalId" element={<GoalDetailPage />} />
      <Route path="/billing" element={<Billing />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/settings/:featureId" element={<FeatureSettingsPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/custom" element={<EmbedPage />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" />} />
    </Routes>
  );
}

export default App;