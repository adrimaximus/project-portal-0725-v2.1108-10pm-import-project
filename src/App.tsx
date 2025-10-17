import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PeoplePage from './pages/People';
import PeopleDetailPage from './pages/PeopleDetail';
import IndexPage from './pages/Index';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <div>
        <nav className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center py-4">
              <Link to="/" className="text-xl font-bold">My App</Link>
              <ul className="flex space-x-4">
                <li><Link to="/" className="text-gray-600 hover:text-gray-900">Home</Link></li>
                <li><Link to="/people" className="text-gray-600 hover:text-gray-900">People</Link></li>
              </ul>
            </div>
          </div>
        </nav>
        <main className="p-4 bg-gray-50 min-h-screen">
          <Toaster position="bottom-right" />
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/people/:id" element={<PeopleDetailPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;