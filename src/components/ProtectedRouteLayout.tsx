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
  
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user) {
    // We have a session, but the user profile is still loading or failed to load.
    // This can happen for new users where the profile creation trigger is slow.
    // We show a loading screen and let the AuthContext's query retry in the background.
    // This avoids a redirect loop between here and the login page.
    return <LoadingScreen />;
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