import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import { UserProvider } from "./contexts/UserContext";
import { Toaster } from "react-hot-toast";
import SettingsPage from "./pages/Settings";

function App() {
  return (
    <UserProvider>
      <Toaster position="bottom-right" />
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;