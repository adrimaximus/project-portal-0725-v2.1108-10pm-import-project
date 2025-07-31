import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Index from "./pages/Index";
import ProjectDetail from "./pages/ProjectDetail";
import RequestPage from "./pages/Request";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <main>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/requests" element={<RequestPage />} />
        </Routes>
      </Router>
      <Toaster />
    </main>
  );
}

export default App;