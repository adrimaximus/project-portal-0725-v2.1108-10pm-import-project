import { Routes, Route, Navigate } from 'react-router-dom';
import PortalLayout from './components/PortalLayout';
import Index from './pages/Index';
import Request from './pages/Request';
import ChatPage from './pages/ChatPage';
import Profile from './pages/Profile';
import MoodTracker from './pages/MoodTracker';
import GoalsPage from './pages/GoalsPage';
import Billing from './pages/Billing';
import GoalDetailPage from './pages/GoalDetailPage';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Settings from './pages/Settings';


function App() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route path="/" element={<Index />} />
        <Route path="/request" element={<Request />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/mood-tracker" element={<MoodTracker />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/goals/:id" element={<GoalDetailPage />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/productivity/*" element={<Navigate to="/mood-tracker" replace />} />
      </Route>
    </Routes>
  );
}

export default App;