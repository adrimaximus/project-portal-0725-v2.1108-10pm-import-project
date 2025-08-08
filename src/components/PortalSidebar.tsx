import { useState, useEffect } from "react";
import { Bell, Home, Package, Settings, LayoutGrid, ChevronDown, LifeBuoy, LogOut, MessageSquare, Smile, Target, CreditCard, Link as LinkIcon, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import OnlineCollaborators from "./OnlineCollaborators";
import { dummyConversations } from "@/data/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/contexts/UserContext";
import { dummyNotifications } from "@/data/notifications";
import { useFeatures } from "@/contexts/FeaturesContext";
import { googleLogout } from "@react-oauth/google";

type PortalSidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
};

type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  isCustom?: boolean;
};

const PortalSidebar = ({ isCollapsed, onToggle }: PortalSidebarProps) => {
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const { isFeatureEnabled } = useFeatures();

  const handleLogout = () => {
    googleLogout();
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const totalUnreadChatCount = dummyConversations.reduce(
    (sum, convo) => sum + convo.unreadCount,
    0
  );

  const unreadNotificationCount = dummyNotifications.filter(n => !n.read).length;

  const [defaultNavItems] = useState<NavItem[]>(() => [
    { id: "dashboard", href: "/", label: "Dashboard", icon: Home },
    { id: "projects", href: "/projects", label: "Projects", icon: Package },
    { id: "request", href: "/request", label: "Request", icon: LayoutGrid },
    { 
      id: "chat",
      href: "/chat", 
      label: "Chat", 
      icon: MessageSquare, 
      ...(totalUnreadChatCount > 0 && { badge: totalUnreadChatCount }) 
    },
    { id: "mood-tracker", href: "/mood-tracker", label: "Mood Tracker", icon: Smile },
    { id: "goals", href: "/goals", label: "Goals", icon: Target },
    { id: "billing", href: "/billing", label: "Billing", icon: CreditCard },
    { id: "settings", href: "/settings", label: "Settings", icon: Settings },
    { id: "notifications", href: "/notifications", label: "Notifications", icon: Bell, ...(unreadNotificationCount > 0 && { badge: unreadNotificationCount }) },
  ]);
  
  const [customNavItems, setCustomNavItems] = useState<NavItem[]>([]);
  const localStorageKey = `customNavItems_${user.id}`;

  useEffect(() => {
    const loadCustomItems = () => {
        try {
          const storedItems = localStorage.getItem(localStorageKey);
          if (storedItems) {
            const parsedItems: {id: string, name: string, url: string}[] = JSON.parse(storedItems);
            const hydratedItems: NavItem[] = parsedItems.map(item => ({
              id: item.id,
              href: `/custom?url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(item.name)}`,
              label: item.name,
              icon: LinkIcon,
              isCustom: true,
            }));
            setCustomNavItems(hydratedItems);
          } else {
            setCustomNavItems([]);
          }
        } catch (error) {
          console.error("Failed to parse custom nav items from localStorage", error);
          setCustomNavItems([]);
        }
    };
    
    loadCustomItems();

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === localStorageKey) {
            loadCustomItems();
        }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    }
  }, [localStorageKey]);

  const NavLink = ({ item }: { item: NavItem }) => {
    if (isCollapsed) {
      return (
        <Tooltip>
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
      );
    }

    return (
      <Link
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
    );
  };

  const visibleDefaultNavItems = defaultNavItems.filter(item => isFeatureEnabled(item.id));
  const allVisibleNavItems = isFeatureEnabled('custom-links')
    ? [...visibleDefaultNavItems, ...customNavItems]
    : visibleDefaultNavItems;

  return (
    <div
      className="h-screen border-r bg-muted/40 transition-all duration-300 ease-in-out"
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
              {allVisibleNavItems.map((item) => (
                <NavLink key={item.id} item={item} />
              ))}
            </nav>
          </TooltipProvider>
        </div>
        <div className="mt-auto">
          <div className="border-t">
            <OnlineCollaborators isCollapsed={isCollapsed} />
          </div>
          <div className="border-t">
            <div className={cn("p-4", isCollapsed && "p-2")}>
              {isCollapsed ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-full h-auto p-1">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="sr-only">{user.name}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">{user.name}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end" className="w-56">
                    <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate('/profile')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <LifeBuoy className="mr-2 h-4 w-4" />
                      <span>Support</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
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
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {user.name}
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
                        to="/profile"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                      >
                        <Settings className="h-4 w-4" />
                        Profile
                      </Link>
                      <Link
                        to="#"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                      >
                        <LifeBuoy className="h-4 w-4" />
                        Support
                      </Link>
                      <Link
                        to="#"
                        onClick={handleLogout}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                      >
                        <LogOut className="h-4 w-4" />
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
    </div>
  );
};

export default PortalSidebar;