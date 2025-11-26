import { useState, useEffect, ReactNode } from "react";
import { Outlet, Link } from "react-router-dom";
import PortalSidebar from "./PortalSidebar";
import PortalHeader from "./PortalHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";

interface PortalLayoutProps {
  children?: ReactNode;
  summary?: ReactNode;
  noPadding?: boolean;
  disableMainScroll?: boolean;
}

const PortalLayout = ({ children, summary, noPadding = false, disableMainScroll = false }: PortalLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const { user } = useAuth();

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  if (!user) {
    // Public Layout (No Sidebar, Simple Header)
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-muted/10">
            <Link to="/" className="flex items-center gap-2 font-semibold">
                <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png" alt="7i Portal Logo" className="h-8 w-8" />
                <span>7i Portal</span>
            </Link>
            <Button asChild variant="outline" size="sm">
                <Link to="/login">Login</Link>
            </Button>
        </header>
        <main className={cn(
            "flex-1 overflow-x-hidden overflow-y-auto",
            !noPadding && "p-4 md:p-6"
        )}>
             <div className="mx-auto max-w-4xl animate-in fade-in duration-500">
                {children || <Outlet />}
            </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Sidebar (Desktop) */}
        <div className={cn(
             "hidden md:block transition-all duration-300 ease-in-out h-screen sticky top-0 border-r bg-muted/40",
             sidebarOpen ? "w-64" : "w-[70px]"
        )}>
             <PortalSidebar isCollapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <PortalHeader summary={summary} />
          
          <main 
            className={cn(
                "flex-1 overflow-x-hidden transition-all duration-200",
                !disableMainScroll && "overflow-y-auto",
                !noPadding && "p-4 md:p-6"
            )}
          >
            <div className={cn("mx-auto max-w-7xl animate-in fade-in duration-500 h-full", noPadding ? "" : "")}>
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PortalLayout;