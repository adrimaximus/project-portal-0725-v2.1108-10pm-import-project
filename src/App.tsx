import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from "@/components/ui/sonner"

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
          <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;