"use client";

import React, { useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import PortalSidebar from "./PortalSidebar";
import PortalHeader from "./PortalHeader";
import { cn } from "@/lib/utils";

type PortalLayoutProps = {
  children: ReactNode;
  noPadding?: boolean;
  summary?: ReactNode;
  disableMainScroll?: boolean;
};

const PortalLayout = ({ children, noPadding: noPaddingProp = false, summary, disableMainScroll: disableMainScrollProp = false }: PortalLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Disable scroll and padding for detail pages
  const isDetailPage = location.pathname.startsWith('/projects/') || location.pathname.startsWith('/requests/');

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const sidebarContainerWidth = isCollapsed ? "md:w-[72px]" : "md:w-[220px] lg:w-[280px]";
  const mainContentMargin = isCollapsed ? "md:ml-[72px]" : "md:ml-[220px] lg:ml-[280px]";

  const disableMainScroll = disableMainScrollProp || isDetailPage;
  const noPadding = noPaddingProp || isDetailPage;

  return (
    <div className="min-h-screen w-full">
      <div
        className={cn(
          "fixed top-0 left-0 h-full z-20 transition-all duration-300 ease-in-out",
          sidebarContainerWidth
        )}
      >
        <PortalSidebar 
          isCollapsed={isCollapsed} 
          onToggle={toggleSidebar}
        />
      </div>
      
      <div className={cn(
        "flex flex-col h-screen transition-[margin-left] duration-300 ease-in-out",
        mainContentMargin
      )}>
        <header className="sticky top-0 z-10 bg-background">
          <PortalHeader />
        </header>
        <main className={cn(
          "flex flex-1 flex-col",
          !disableMainScroll && "overflow-auto",
          !noPadding && "gap-2 px-4 py-2 lg:gap-4 lg:px-6 lg:py-4"
        )}>
          {children}
        </main>
        {summary}
      </div>
    </div>
  );
};

export default PortalLayout;