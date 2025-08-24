import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import AccessDenied from "./AccessDenied";

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
}

const PermissionGuard = ({ children, permission }: PermissionGuardProps) => {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) {
    return <AccessDenied />;
  }
  return <>{children}</>;
};

export default PermissionGuard;