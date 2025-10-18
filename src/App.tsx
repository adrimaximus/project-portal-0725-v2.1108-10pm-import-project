import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import { Button } from './components/ui/button';

// A placeholder for your main application component
const AppLayout = () => {
  const { session, user, handleLogout } = useAuth();
  if (!session || !user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <p>Welcome back, {user.user_metadata.first_name || user.email}!</p>
          <p>You are now logged in.</p>
        </div>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/forgot-password" element={session ? <Navigate to="/" /> : <ForgotPasswordPage />} />
      <Route path="/update-password" element={<UpdatePasswordPage />} />
      <Route path="/" element={<AppLayout />} />
      <Route path="*" element={<Navigate to={session ? "/" : "/login"} />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AppRoutes />
  );
};

export default App;