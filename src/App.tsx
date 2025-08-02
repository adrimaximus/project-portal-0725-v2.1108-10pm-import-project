import { Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import RequestPage from './pages/Request';
import ChatPage from './pages/ChatPage';
import MoodTracker from './pages/MoodTracker';
import GoalsPage from './pages/GoalsPage';
import GoalDetailPage from './pages/GoalDetailPage';
import ProjectDetail from './pages/ProjectDetail';
import Profile from './pages/Profile';
import Billing from './pages/Billing';
import NotFound from './pages/NotFound';
import { GoalsProvider } from './context/GoalsContext';
import Notifications from './pages/Notifications';
import SearchPage from './pages/SearchPage';

function App() {
  return (
    <GoalsProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/request" element={<RequestPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/mood-tracker" element={<MoodTracker />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/goals/:goalId" element={<GoalDetailPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </GoalsProvider>
  );
}

export default App;