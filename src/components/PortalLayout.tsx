import { useState } from "react";
import { Outlet } from "react-router-dom";
import PortalSidebar from "./PortalSidebar";
import PortalHeader from "./PortalHeader";
import { cn } from "@/lib/utils";
import ContentLayout from "./ContentLayout";
import React from "react";

interface PortalLayoutProps {
  children?: React.ReactNode;
  summary?: React.ReactNode;
  disableMainScroll?: boolean;
  noPadding?: boolean;
}

const PortalLayout = ({ children, summary, disableMainScroll, noPadding }: PortalLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // If `children` is provided, it's being used as a wrapper.
  // If not, it's a layout route, so use `<Outlet />`.
  const content = children ?? <Outlet />;

  return (
    <div className={cn(
        "grid min-h-screen w-full",
        isSidebarCollapsed ? "md:grid-cols-[80px_1fr]" : "md:grid-cols-[280px_1fr]"
      )}>
      <PortalSidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className="flex flex-col">
        <PortalHeader />
        <ContentLayout
          summary={summary}
          disableMainScroll={disableMainScroll}
          noPadding={noPadding}
        >
          {content}
        </ContentLayout>
      </div>
    </div>
  );
};

export default PortalLayout;