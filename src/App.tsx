import { Routes, Route } from "react-router-dom";
import PortalLayout from "./components/PortalLayout";
import Dashboard from "./pages/Dashboard";
import RequestPage from "./pages/RequestPage";
import ChatPage from "./pages/ChatPage";
import MoodTrackerPage from "./pages/MoodTrackerPage";
import GoalsPage from "./pages/GoalsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PortalLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="request" element={<RequestPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:conversationId" element={<ChatPage />} />
        <Route path="mood-tracker" element={<MoodTrackerPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
    </Routes>
  );
}

export default App;