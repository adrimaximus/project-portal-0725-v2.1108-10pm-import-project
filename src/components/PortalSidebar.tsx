import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Home, LineChart, Package, Package2, ShoppingCart, Users, FilePlus2, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import OnlineCollaborators from "./OnlineCollaborators";

type PortalSidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

const PortalSidebar = ({ isCollapsed, onToggle }: PortalSidebarProps) => {
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
      isActive && "bg-muted text-primary"
    );

  return (
    <div className={cn("hidden border-r bg-muted/40 md:block h-screen transition-all duration-300 ease-in-out", isCollapsed ? "w-[72px]" : "w-[220px] lg:w-[280px]")}>
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span className={cn("transition-opacity", isCollapsed && "opacity-0 w-0")}>Dyad Inc</span>
          </NavLink>
          {!isCollapsed && (
            <Button variant="outline" size="icon" className="ml-auto h-8 w-8" onClick={onToggle}>
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
          )}
        </div>
        <div className="flex-1">
          <nav className={cn("grid items-start text-sm font-medium", isCollapsed ? "px-2" : "px-2 py-4 lg:px-4")}>
            <NavLink to="/" end className={navLinkClasses}>
              <Home className="h-4 w-4" />
              <span className={cn(isCollapsed && "sr-only")}>Dasbor</span>
            </NavLink>
            <NavLink to="/chat" className={navLinkClasses}>
              <MessageSquare className="h-4 w-4" />
              <span className={cn(isCollapsed && "sr-only")}>Obrolan</span>
            </NavLink>
            <NavLink to="/requests/new" className={navLinkClasses}>
              <FilePlus2 className="h-4 w-4" />
              <span className={cn(isCollapsed && "sr-only")}>Permintaan Baru</span>
            </NavLink>
            <NavLink to="/analytics" className={navLinkClasses}>
              <LineChart className="h-4 w-4" />
              <span className={cn(isCollapsed && "sr-only")}>Analitik</span>
            </NavLink>
          </nav>
        </div>
        {!isCollapsed && (
          <div className="mt-auto">
            <OnlineCollaborators isCollapsed={isCollapsed} />
            <div className="p-4">
              <Card>
                <CardHeader className="p-2 pt-0 md:p-4">
                  <CardTitle>Upgrade ke Pro</CardTitle>
                  <CardDescription>Buka semua fitur dan dapatkan akses tak terbatas ke tim dukungan kami.</CardDescription>
                </CardHeader>
                <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                  <Button size="sm" className="w-full">Upgrade</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortalSidebar;