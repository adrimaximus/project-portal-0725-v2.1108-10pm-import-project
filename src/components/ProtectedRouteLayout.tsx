import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import { useFeatures } from "@/contexts/FeaturesContext";
import React from "react";

interface ProtectedRouteLayoutProps {
  featureId?: string;
}

const ProtectedRouteLayout = ({ featureId }: ProtectedRouteLayoutProps) => {
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

  return <Outlet />;
};

export default ProtectedRouteLayout;