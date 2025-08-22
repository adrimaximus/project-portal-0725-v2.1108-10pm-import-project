import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import { useFeatures } from "@/contexts/FeaturesContext";
import React, { useEffect } from "react";
import { toast } from "sonner";

const AccessDenied = () => {
  const navigate = useNavigate();
  useEffect(() => {
    toast.error("You do not have permission to access this page.");
    navigate('/dashboard', { replace: true });
  }, [navigate]);
  return <LoadingScreen />;
};

interface ProtectedRouteLayoutProps {
  featureId?: string;
  allowedRoles?: string[];
}

const ProtectedRouteLayout = ({ featureId, allowedRoles }: ProtectedRouteLayoutProps) => {
  const { session, user, loading } = useAuth();
  const { isFeatureEnabled } = useFeatures();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!user) {
    return <LoadingScreen />;
  }

  if (featureId && !isFeatureEnabled(featureId)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role || '')) {
    return <AccessDenied />;
  }

  return <Outlet />;
};

export default ProtectedRouteLayout;