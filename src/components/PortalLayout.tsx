import { useState } from "react";
import { Outlet } from "react-router-dom";
import PortalSidebar from "./PortalSidebar";
import PortalHeader from "./PortalHeader";
import { Toaster } from "@/components/ui/toaster";

const PortalLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen w-full">
      <PortalSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <div className="flex flex-col flex-1 bg-muted/40">
        <PortalHeader />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet />
        </main>
        <Toaster />
      </div>
    </div>
  );
};

export default PortalLayout;