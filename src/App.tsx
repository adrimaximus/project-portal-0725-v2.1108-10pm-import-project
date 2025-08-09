import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login';
import MoodTracker from './pages/MoodTracker';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from "@/components/ui/sonner"

function App() {
  return (
    <>
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
    </>
  );
}

export default App;