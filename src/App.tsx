import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/Login';
import MoodTracker from './pages/MoodTracker';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MoodTracker />
            </ProtectedRoute>
          } 
        />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;