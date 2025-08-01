import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import Request from "./pages/Request";
import Chat from "./pages/Chat";
import MoodTracker from "./pages/MoodTracker";
import Goals from "./pages/Goals";
import Notifications from "./pages/Notifications";
import ProjectDetail from "./pages/ProjectDetail";
import { UserProvider } from "./contexts/UserContext";
import Settings from "./pages/Settings";

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/request" element={<Request />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/mood-tracker" element={<MoodTracker />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;