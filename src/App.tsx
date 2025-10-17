import { Routes, Route, Link } from 'react-router-dom';
import Index from './pages/Index';
import ProjectsPage from './pages/projects/ProjectsPage';
import { SessionContextProvider } from './contexts/SessionContext';

function App() {
  return (
    <SessionContextProvider>
      <div>
        <nav className="p-4 bg-gray-100">
          <Link to="/" className="mr-4">Home</Link>
          <Link to="/projects">Projects</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>
      </div>
    </SessionContextProvider>
  );
}

export default App;