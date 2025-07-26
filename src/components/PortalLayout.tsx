"use client";

import React, { useState, ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";
import PortalHeader from "./PortalHeader";
import { cn } from "@/lib/utils";

type PortalLayoutProps = {
  children: ReactNode;
  noPadding?: boolean;
  summary?: ReactNode;
};

const PortalLayout = ({ children, noPadding = false, summary }: PortalLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const gridCols = isCollapsed
    ? "md:grid-cols-[72px_1fr]"
    : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]";

  return (
    <div
      className={cn(
        "grid h-screen w-full overflow-hidden transition-[grid-template-columns] duration-300 ease-in-out",
        gridCols
      )}
    >
      <PortalSidebar 
        isCollapsed={isCollapsed} 
        onToggle={toggleSidebar}
      />
      <div className="flex flex-col overflow-hidden">
        <header className="sticky top-0 z-10 bg-background flex-shrink-0">
          <PortalHeader />
        </header>
        <main className={cn(
          "flex-1",
          noPadding ? "overflow-hidden" : "overflow-y-auto p-4 lg:p-6"
        )}>
          {children}
        </main>
        {summary && <div className="flex-shrink-0">{summary}</div>}
      </div>
    </div>
  );
};

export default PortalLayout;