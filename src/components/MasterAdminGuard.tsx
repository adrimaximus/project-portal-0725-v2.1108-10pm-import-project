import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import AccessDenied from "./AccessDenied";

interface MasterAdminGuardProps {
  children: React.ReactNode;
}

const MasterAdminGuard = ({ children }: MasterAdminGuardProps) => {
  const { user } = useAuth();
  if (user?.role !== 'master admin') {
    return <AccessDenied />;
  }
  return <>{children}</>;
};

export default MasterAdminGuard;