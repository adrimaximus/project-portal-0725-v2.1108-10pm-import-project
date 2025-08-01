import { Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RequestPage from "./pages/RequestPage";
import ChatPage from "./pages/ChatPage";
import MoodTrackerPage from "./pages/MoodTrackerPage";
import GoalsPage from "./pages/GoalsPage";
import ProfilePage from "./pages/ProfilePage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import NotificationsPage from "./pages/Notifications";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/request" element={<RequestPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/mood-tracker" element={<MoodTrackerPage />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
    </Routes>
  );
}

export default App;