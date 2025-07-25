"use client";

import React, { useState, ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";
import PortalHeader from "./PortalHeader";
import { cn } from "@/lib/utils";
import { Collaborator } from "../types";
import ChatPanel from "./ChatPanel";

type PortalLayoutProps = {
  children: ReactNode;
};

const PortalLayout = ({ children }: PortalLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleCollaboratorSelect = (collaborator: Collaborator) => {
    setSelectedCollaborator(collaborator);
  };

  const handleCloseChat = () => {
    setSelectedCollaborator(null);
  };

  const baseGridCols = isCollapsed
    ? "md:grid-cols-[72px_1fr]"
    : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]";
  
  const chatOpenGridCols = isCollapsed
    ? "md:grid-cols-[72px_1fr_340px]"
    : "md:grid-cols-[280px_1fr_340px]";

  return (
    <div
      className={cn(
        "grid min-h-screen w-full transition-[grid-template-columns] duration-300 ease-in-out",
        selectedCollaborator ? chatOpenGridCols : baseGridCols
      )}
    >
      <PortalSidebar 
        isCollapsed={isCollapsed} 
        onToggle={toggleSidebar}
        onCollaboratorSelect={handleCollaboratorSelect}
      />
      <div className="flex flex-col h-screen overflow-hidden">
        <header className="sticky top-0 z-10 bg-background">
          <PortalHeader />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
      {selectedCollaborator && (
        <ChatPanel collaborator={selectedCollaborator} onClose={handleCloseChat} />
      )}
    </div>
  );
};

export default PortalLayout;