import { useState, ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";
import { cn } from "@/lib/utils";
import PortalHeader from "./PortalHeader";
import StorageWarning from "./StorageWarning";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "./PullToRefreshIndicator";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type PortalLayoutProps = {
  children: ReactNode;
  summary?: ReactNode;
  pageHeader?: ReactNode;
  disableMainScroll?: boolean;
  noPadding?: boolean;
};

export default function PortalLayout({ children, summary, pageHeader, disableMainScroll, noPadding }: PortalLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    toast.info("Refreshing data...");
    await queryClient.invalidateQueries();
    toast.success("Data refreshed!");
  };

  const { isRefreshing, pullPosition, handlers, setRef } = usePullToRefresh(handleRefresh);

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
        {pageHeader}
        <main 
          ref={setRef}
          {...handlers}
          className={cn(
            "flex-1 min-h-0 relative overscroll-y-contain",
            !disableMainScroll && "overflow-y-auto",
            disableMainScroll && "flex flex-col",
            !noPadding && "p-4 pb-24 md:p-8"
          )}
        >
          <PullToRefreshIndicator isRefreshing={isRefreshing} pullPosition={pullPosition} />
          {children}
        </main>
      </div>

      {/* Storage Warning Component */}
      <StorageWarning />
    </div>
  );
}