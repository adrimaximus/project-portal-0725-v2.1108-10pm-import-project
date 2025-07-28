import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PortalLayout from "./components/PortalLayout";
import Index from "./pages/Index";
import RequestPage from "./pages/RequestPage";
import ChatPage from "./pages/ChatPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import NotificationsPage from "./pages/Notifications";
import SettingsPage from "./pages/Settings";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PortalLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/request" element={<RequestPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:conversationId" element={<ChatPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;