import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PeopleDemoPage from './pages/PeopleDemoPage';
import Index from './pages/Index';

function App() {
  return (
    <Router>
      <div>
        <nav className="p-4 bg-gray-100 border-b">
          <div className="container mx-auto flex gap-4">
            <Link to="/" className="text-gray-700 hover:text-black font-medium">Home</Link>
            <Link to="/people-demo" className="text-gray-700 hover:text-black font-medium">People Demo</Link>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/people-demo" element={<PeopleDemoPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;