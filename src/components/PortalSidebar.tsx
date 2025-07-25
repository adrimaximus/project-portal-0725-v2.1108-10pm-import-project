import { useState } from "react";
import { Bell, Home, Package, Settings, LayoutGrid, CircleUser, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/request", label: "Request", icon: LayoutGrid },
  { href: "#", label: "Notifications", icon: Bell, badge: 3 },
  { href: "#", label: "Settings", icon: Settings },
];

type PortalSidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

const PortalSidebar = ({ isCollapsed, onToggle }: PortalSidebarProps) => {
  const location = useLocation();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  return (
    <div
      className="hidden h-screen border-r bg-muted/40 md:block transition-all duration-300 ease-in-out"
      onDoubleClick={onToggle}
    >
      <div className="flex h-full max-h-screen flex-col">
        <div
          className={cn(
            "flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold"
            title="Client Portal"
          >
            <Package className="h-6 w-6" />
            <span className={cn(isCollapsed && "sr-only")}>
              Client Portal
            </span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <TooltipProvider delayDuration={0}>
            <nav
              className={cn(
                "grid items-start gap-1 text-sm font-medium",
                isCollapsed ? "px-2" : "px-2 lg:px-4"
              )}
            >
              {navItems.map((item) =>
                isCollapsed ? (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.href}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8 relative",
                          location.pathname === item.href && "bg-muted text-primary"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                        {item.badge && (
                          <Badge className="absolute -top-1 -right-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full p-0 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      location.pathname === item.href && "bg-muted text-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.badge && (
                      <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                )
              )}
            </nav>
          </TooltipProvider>
        </div>
        <div className="mt-auto border-t">
          <div className={cn("p-4", isCollapsed && "p-2")}>
            {isCollapsed ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-full">
                          <CircleUser className="h-5 w-5" />
                          <span className="sr-only">My Account</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">My Account</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Support</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div>
                <Button
                  variant="ghost"
                  className="w-full justify-between gap-3 px-3"
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                >
                  <span className="flex items-center gap-3">
                    <CircleUser className="h-5 w-5" />
                    My Account
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isAccountMenuOpen && "rotate-180"
                    )}
                  />
                </Button>
                {isAccountMenuOpen && (
                  <nav className="grid items-start gap-1 text-sm font-medium mt-2 pl-8">
                    <Link
                      to="#"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                      Settings
                    </Link>
                    <Link
                      to="#"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                      Support
                    </Link>
                    <Link
                      to="#"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                    >
                      Logout
                    </Link>
                  </nav>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortalSidebar;