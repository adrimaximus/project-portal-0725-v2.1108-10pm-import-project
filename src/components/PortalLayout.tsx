import { useState } from "react";
import { Outlet } from "react-router-dom";
import PortalSidebar from "./PortalSidebar";

const PortalLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <PortalSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <div className="flex flex-col flex-1">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;