import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import React from "react";

const ProtectedRouteLayout = () => {
  const { session, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!user) {
    // This state might happen briefly while the profile is being fetched after a session is found.
    // LoadingScreen is appropriate here.
    return <LoadingScreen />;
  }

  return <Outlet />;
};

export default ProtectedRouteLayout;