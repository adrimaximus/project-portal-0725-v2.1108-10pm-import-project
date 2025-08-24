import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import React from "react";

const ProtectedRouteLayout = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Saat status otentikasi sedang dimuat, jangan render apa pun.
    // Suspense di App.tsx akan menangani tampilan layar loading.
    return null;
  }

  if (!session) {
    // Jika tidak login, arahkan ke halaman login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika sudah login, render halaman yang diminta.
  return <Outlet />;
};

export default ProtectedRouteLayout;