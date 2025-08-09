import { Routes, Route } from 'react-router-dom';
import IndexPage from './pages/Index';
import Login from './pages/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route 
        path="/*"
        element={
          <ProtectedRoute>
            <Routes>
              <Route path="/" element={<IndexPage />} />
              {/* Add other protected routes here */}
            </Routes>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;