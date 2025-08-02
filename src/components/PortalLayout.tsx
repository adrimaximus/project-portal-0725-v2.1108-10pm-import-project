import { useState } from "react";
import PortalSidebar from "@/components/PortalSidebar";

const PortalLayout = ({ children }: { children: React.ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen w-full bg-muted/40">
      <PortalSidebar
        isCollapsed={isCollapsed}
        onToggle={toggleSidebar}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* A header could be placed here if needed in the future */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;