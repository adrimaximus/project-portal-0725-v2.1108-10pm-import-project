import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import { useFeatures } from "@/contexts/FeaturesContext";
import React from "react";

interface ProtectedRouteLayoutProps {
  featureId?: string;
}

const ProtectedRouteLayout = ({ featureId }: ProtectedRouteLayoutProps) => {
  const { session, user, loading, hasPermission } = useAuth();
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

  // Logika pengalihan jika dasbor dinonaktifkan
  if (location.pathname === '/dashboard' && !isFeatureEnabled('dashboard')) {
    // Urutan prioritas untuk pengalihan
    const pageOrder = [
      'projects', 'request', 'chat', 'goals', 'people', 
      'knowledge-base', 'billing', 'mood-tracker', 'settings'
    ];

    const firstAvailablePage = pageOrder.find(id =>
      isFeatureEnabled(id) && hasPermission(`module:${id}`)
    );

    if (firstAvailablePage) {
      return <Navigate to={`/${firstAvailablePage}`} replace />;
    }
    
    // Fallback jika tidak ada halaman lain yang tersedia
    return <Navigate to="/profile" replace />;
  }

  if (featureId && !isFeatureEnabled(featureId)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRouteLayout;