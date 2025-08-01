import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Request from "./pages/Request";
import Chat from "./pages/Chat";
import MoodTracker from "./pages/MoodTracker";
import Goals from "./pages/Goals";
import ProjectDetail from "./pages/ProjectDetail";
import Profile from "./pages/Profile";
import { UserProvider } from "./context/UserContext";

function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/request" element={<Request />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/mood-tracker" element={<MoodTracker />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/project/:projectId" element={<ProjectDetail />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </UserProvider>
  );
}

export default App;