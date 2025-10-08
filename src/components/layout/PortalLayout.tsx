import React, { useState } from 'react';
import PortalSidebar from '../PortalSidebar';
import PortalHeader from '../PortalHeader';

interface PortalLayoutProps {
  children: React.ReactNode;
  summary?: React.ReactNode;
}

const PortalLayout = ({ children, summary }: PortalLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr] lg:grid-cols-[auto_1fr]">
      <PortalSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <div className="flex flex-col">
        <PortalHeader summary={summary} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-muted/40">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;