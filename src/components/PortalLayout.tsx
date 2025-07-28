import { useState } from "react";
import { Outlet } from "react-router-dom";
import PortalSidebar from "./PortalSidebar";
import MobileHeader from "./MobileHeader";

const PortalLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prevState => !prevState);
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <PortalSidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className="flex flex-col flex-1">
        <MobileHeader />
        <main className="flex-1 p-4 sm:px-6 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;