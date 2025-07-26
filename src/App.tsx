import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProjectsDashboard from "./pages/ProjectsDashboard";
import ProjectDetail from "./pages/ProjectDetail";
import NewRequest from "./pages/NewRequest";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ProjectsDashboard />} />
          <Route path="/projects" element={<ProjectsDashboard />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />
          <Route path="/request" element={<NewRequest />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;