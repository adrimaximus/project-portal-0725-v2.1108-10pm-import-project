import { useState, ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";
import { cn } from "@/lib/utils";
import GlobalSearch from "./GlobalSearch";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type PortalLayoutProps = {
  children: ReactNode;
  summary?: ReactNode;
  pageHeader?: ReactNode;
  disableMainScroll?: boolean;
  noPadding?: boolean;
};

const PortalLayout = ({ children, summary, pageHeader, disableMainScroll, noPadding }: PortalLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen w-full bg-muted/40">
      {/* Desktop Sidebar: Hidden on small screens */}
      <div className="hidden sm:block">
        <PortalSidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      </div>

      <div className="flex flex-1 flex-col">
        <header className="relative z-30 flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 sm:h-[60px] sm:px-6">
          {/* Mobile Sidebar: Uses a Sheet component */}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs p-0">
              {/* Render the existing sidebar inside the sheet */}
              <PortalSidebar isCollapsed={false} onToggle={() => {}} />
            </SheetContent>
          </Sheet>

          {summary}
          <GlobalSearch />
        </header>
        {pageHeader}
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