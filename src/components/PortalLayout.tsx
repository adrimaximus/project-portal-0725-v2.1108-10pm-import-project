import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { BroadcastToast } from "./BroadcastToast";

const PortalLayout = ({ children }: { children?: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          sidebarOpen && !isMobile ? "ml-64" : "ml-0"
        )}
      >
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
            {children || <Outlet />}
          </div>
        </main>
      </div>
      
      {/* Global Notification System */}
      <BroadcastToast />
    </div>
  );
};

export default PortalLayout;