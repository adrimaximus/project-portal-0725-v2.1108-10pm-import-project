import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PortalSidebar from './PortalSidebar';
import { cn } from '@/lib/utils';

const PortalLayout = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(prevState => !prevState);
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-[56px]" : "w-[280px]"
      )}>
        <PortalSidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      </div>
      <div className="flex flex-col flex-1">
        <main className="flex-1 p-4 sm:px-6 sm:py-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;