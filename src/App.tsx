import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import IndexPage from './pages/Index';
import ProjectDetailPage from './pages/ProjectDetailPage';
import { ProjectProvider } from './contexts/ProjectContext';

function App() {
  return (
    <ProjectProvider>
      <Router>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<IndexPage />} />
            <Route path="/projects" element={<Navigate to="/" replace />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          </Route>
          {/* You can add other routes like 404 page here */}
        </Routes>
      </Router>
    </ProjectProvider>
  );
}

export default App;