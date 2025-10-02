import { useState, ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";
import { cn } from "@/lib/utils";
import PortalHeader from "./PortalHeader";
import StorageWarning from "./StorageWarning";

type PortalLayoutProps = {
  children: ReactNode;
  summary?: ReactNode;
  pageHeader?: ReactNode;
  noPadding?: boolean;
};

export default function PortalLayout({ children, summary, pageHeader, noPadding }: PortalLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Desktop Sidebar: Hidden on small screens, now sticky */}
      <div className="hidden sm:block sticky top-0 h-screen self-start">
        <PortalSidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      </div>

      <div className="flex flex-1 flex-col">
        {/* Header is now sticky */}
        <header className="sticky top-0 z-10">
          <PortalHeader summary={summary} />
        </header>

        {/* Main content area, will scroll with the page */}
        <div>
          {pageHeader}
          <main className={cn(!noPadding && "p-4 md:p-8")}>
            {children}
          </main>
        </div>
      </div>

      {/* Storage Warning Component */}
      <StorageWarning />
    </div>
  );
}