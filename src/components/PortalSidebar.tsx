import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Briefcase,
  ListChecks,
  Mail,
  MessageSquare,
  Smile,
  Target,
  CreditCard,
  Users,
  Book,
  Settings,
  PanelLeft,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PortalSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const PortalSidebar = ({ isCollapsed, onToggle }: PortalSidebarProps) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', url: '/dashboard', icon: Home },
    { name: 'Projects', url: '/projects', icon: Briefcase },
    { name: 'Tasks', url: '/tasks', icon: ListChecks },
    { name: 'Requests', url: '/request', icon: Mail },
    { name: 'Chat', url: '/chat', icon: MessageSquare },
    { name: 'Mood Trackers', url: '/mood-tracker', icon: Smile },
    { name: 'Goals', url: '/goals', icon: Target },
    { name: 'Billing', url: '/billing', icon: CreditCard },
    { name: 'People', url: '/people', icon: Users },
    { name: 'Knowledge Base', url: '/knowledge-base', icon: Book },
  ];

  return (
    <aside
      className={cn(
        "hidden border-r bg-background md:flex md:flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-14" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6" />
          {!isCollapsed && <span className="font-bold">Acme Inc</span>}
        </Link>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onToggle}
        >
          <PanelLeft className="h-4 w-4" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      </div>
      <nav className="flex-1 overflow-auto py-4">
        <TooltipProvider>
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.url}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                          location.pathname === item.url && "bg-muted text-primary"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {!isCollapsed && item.name}
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">{item.name}</TooltipContent>
                    )}
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </TooltipProvider>
      </nav>
      <div className="mt-auto border-t p-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/settings"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  location.pathname.startsWith('/settings') && "bg-muted text-primary"
                )}
              >
                <Settings className="h-4 w-4" />
                {!isCollapsed && "Settings"}
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">Settings</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
};

export default PortalSidebar;