import { Link, useLocation } from "react-router-dom";
import { Home, MessageSquare, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import OnlineCollaborators from "./OnlineCollaborators";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type PortalSidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

const PortalSidebar = ({ isCollapsed, onToggle }: PortalSidebarProps) => {
  const location = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/requests", label: "Requests", icon: ClipboardList },
  ];

  const NavLink = ({ href, icon: Icon, label }: { href: string, icon: React.ElementType, label: string }) => {
    const isActive = location.pathname === href;
    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={href}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <Link
        to={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
          isActive ? "bg-muted text-primary" : "text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  return (
    <div className={cn("hidden border-r bg-muted/40 md:flex md:flex-col", isCollapsed ? "items-center" : "")}>
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className={cn(isCollapsed && "sr-only")}>My App</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className={cn("grid items-start gap-1", isCollapsed ? "px-2" : "px-2 py-4 lg:px-4")}>
            {navItems.map(item => <NavLink key={item.href} {...item} />)}
          </nav>
          <div className="my-4">
            <OnlineCollaborators isCollapsed={isCollapsed} />
          </div>
        </div>
        <div className="mt-auto p-4">
          <Button size="icon" className="rounded-full w-8 h-8" variant="ghost" onClick={onToggle}>
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PortalSidebar;