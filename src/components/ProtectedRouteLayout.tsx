import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "./LoadingScreen";
import React from "react";
import { ChatProvider } from "@/contexts/ChatContext";
import { FeaturesProvider } from "@/contexts/FeaturesContext";
import { BroadcastToast } from "./BroadcastToast";
import { GlobalNotificationListener } from "./GlobalNotificationListener";
import ImpersonationBanner from "./ImpersonationBanner";

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
    <FeaturesProvider>
      <ChatProvider>
        <Outlet />
        <BroadcastToast />
        <GlobalNotificationListener />
        <ImpersonationBanner />
      </ChatProvider>
    </FeaturesProvider>
  );
};

export default ProtectedRouteLayout;