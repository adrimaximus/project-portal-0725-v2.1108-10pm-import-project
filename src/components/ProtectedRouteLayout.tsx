import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PortalLayout from "./PortalLayout";
import { useEffect } from "react";
import LoadingScreen from "./LoadingScreen";

const ProtectedRouteLayout = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname && location.pathname !== '/settings') {
      localStorage.setItem('lastVisitedPage', location.pathname);
    }
  }, [location.pathname]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PortalLayout>
      <Outlet />
    </PortalLayout>
  );
};

export default ProtectedRouteLayout;