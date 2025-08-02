import { useState, ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";
import PortalHeader from "./PortalHeader";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface PortalLayoutProps {
  children: ReactNode;
  summary?: ReactNode;
  disableMainScroll?: boolean;
  noPadding?: boolean;
}

const PortalLayout = ({ children, summary, disableMainScroll, noPadding }: PortalLayoutProps) => {
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
        <main className={cn(
          "flex-1",
          !disableMainScroll && "overflow-auto",
          !noPadding && "p-4 sm:p-6"
        )}>
          {children}
        </main>
        {summary}
        <Toaster />
      </div>
    </div>
  );
};

export default PortalLayout;