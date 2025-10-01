import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PortalLayout from './PortalLayout';
import { Loader2 } from 'lucide-react';

const ProtectedRouteLayout = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <PortalLayout>
      <Outlet />
    </PortalLayout>
  );
};

export default ProtectedRouteLayout;