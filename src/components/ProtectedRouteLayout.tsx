import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import React from "react";
import { ChatProvider } from "@/contexts/ChatContext";

const ProtectedRouteLayout = () => {
  const { session, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }
  
  if (!session || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ChatProvider>
      <Outlet />
    </ChatProvider>
  );
};

export default ProtectedRouteLayout;