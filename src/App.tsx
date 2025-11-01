import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import Projects from './pages/Projects';
import Billing from './pages/Billing';
import ProjectDetail from './pages/ProjectDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
      </Routes>
    </Router>
  );
}

export default App;