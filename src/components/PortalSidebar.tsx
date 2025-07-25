"use client";

import {
  Home,
  Package,
  MessageSquare,
  LineChart,
  PanelLeftClose,
  PanelRightClose,
  Package2,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { conversations } from "@/data/chat";
import { NavItem } from "@/types";
import { cn } from "@/lib/utils";
import OnlineCollaborators from "./OnlineCollaborators";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface PortalSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/projects", icon: Package, label: "Projects" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/request", icon: LineChart, label: "Request" },
];

const PortalSidebar = ({ isCollapsed, onToggle }: PortalSidebarProps) => {
  const unreadMessages = conversations.reduce(
    (acc, convo) => acc + convo.unreadCount,
    0
  );

  return (
    <div
      className={cn(
        "hidden border-r bg-muted/40 md:flex md:flex-col",
        "transition-all duration-300 ease-in-out"
      )}
    >
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 justify-between">
          <NavLink to="/" className={cn("flex items-center gap-2 font-semibold", isCollapsed && "hidden")}>
            <Package2 className="h-6 w-6" />
            <span>Acme Inc</span>
          </NavLink>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            {isCollapsed ? <PanelRightClose className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
              isCollapsed ? (
                <TooltipProvider key={item.label} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) => cn(
                          "flex items-center justify-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                          isActive && "bg-muted text-primary"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.href}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.label === "Chat" && unreadMessages > 0 && (
                    <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                      {unreadMessages}
                    </Badge>
                  )}
                </NavLink>
              )
            ))}
          </nav>
        </div>
        <div className={cn("mt-auto p-4", isCollapsed && "hidden")}>
          <OnlineCollaborators />
        </div>
      </div>
    </div>
  );
};

export default PortalSidebar;