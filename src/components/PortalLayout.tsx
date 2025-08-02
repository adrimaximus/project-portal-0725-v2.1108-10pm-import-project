import { useState, ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";
import { cn } from "@/lib/utils";

type PortalLayoutProps = {
  children: ReactNode;
  summary?: ReactNode;
  disableMainScroll?: boolean;
  noPadding?: boolean;
};

const PortalLayout = ({ children, summary, disableMainScroll, noPadding }: PortalLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen w-full bg-muted/40">
      <PortalSidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {summary && (
          <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 sm:h-[60px] sm:px-6">
            {summary}
          </header>
        )}
        <main
          className={cn(
            "flex-1",
            !disableMainScroll && "overflow-y-auto",
            !noPadding && "p-4 md:p-8"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;