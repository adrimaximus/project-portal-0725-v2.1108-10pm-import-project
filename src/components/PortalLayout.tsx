"use client";

import React, { useState, ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";
import PortalHeader from "./PortalHeader";
import { cn } from "@/lib/utils";

type PortalLayoutProps = {
  children: ReactNode;
  noPadding?: boolean;
};

const PortalLayout = ({ children, noPadding = false }: PortalLayoutProps) => {
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
        "grid min-h-screen w-full transition-[grid-template-columns] duration-300 ease-in-out",
        gridCols
      )}
    >
      <PortalSidebar 
        isCollapsed={isCollapsed} 
        onToggle={toggleSidebar}
      />
      <div className="flex flex-col h-screen overflow-hidden">
        <header className="sticky top-0 z-10 bg-background">
          <PortalHeader />
        </header>
        <main className={cn(
          "flex flex-1 flex-col overflow-auto",
          !noPadding && "gap-4 p-4 lg:gap-6 lg:p-6"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;