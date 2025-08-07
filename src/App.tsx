import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import ProjectDetail from "./pages/ProjectDetail";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "./contexts/UserContext";
import { ProjectProvider } from "./contexts/ProjectContext";

function App() {
  return (
    <UserProvider>
      <ProjectProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />} />
          </Routes>
        </Router>
        <Toaster />
      </ProjectProvider>
    </UserProvider>
  );
}

export default App;