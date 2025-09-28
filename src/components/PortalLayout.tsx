import { useState, ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";
import { cn } from "@/lib/utils";
import PortalHeader from "./PortalHeader";
import StorageWarning from "./StorageWarning";

type PortalLayoutProps = {
  children: ReactNode;
  summary?: ReactNode;
  pageHeader?: ReactNode;
  disableMainScroll?: boolean;
  noPadding?: boolean;
};

export default function PortalLayout({ children, summary, pageHeader, disableMainScroll, noPadding }: PortalLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen w-full bg-muted/40">
      {/* Desktop Sidebar: Hidden on small screens */}
      <div className="hidden sm:block">
        <PortalSidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <PortalHeader summary={summary} />

        {/* Refactored scrollable content area */}
        <div className={cn("flex-1 min-h-0", !disableMainScroll && "overflow-y-auto")}>
          {pageHeader}
          <main className={cn("h-full", !noPadding && "p-4 md:p-8")}>
            {children}
          </main>
        </div>
      </div>

      {/* Storage Warning Component */}
      <StorageWarning />
    </div>
  );
}