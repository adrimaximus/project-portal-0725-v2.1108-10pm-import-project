import { useState, ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";
import PortalHeader from "./PortalHeader";
import { cn } from "@/lib/utils";

interface PortalLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
  summary?: ReactNode;
  disableMainScroll?: boolean;
}

const PortalLayout = ({ children, noPadding, summary, disableMainScroll }: PortalLayoutProps) => {
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
        <div className={cn("flex-1 flex flex-col", summary ? "overflow-hidden" : "")}>
          <main className={cn(
            "flex-1",
            !noPadding && "p-4 sm:p-6",
            disableMainScroll ? "overflow-y-hidden" : "overflow-y-auto"
          )}>
            {children}
          </main>
          {summary}
        </div>
      </div>
    </div>
  );
};

export default PortalLayout;