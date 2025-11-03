import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import ProjectsPage from './pages/ProjectsPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/projects" element={<ProjectsPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;