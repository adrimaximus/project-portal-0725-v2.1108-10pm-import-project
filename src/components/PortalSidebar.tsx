import { useState, useEffect } from "react";
import { Bell, Home, Package, Settings, LayoutGrid, MessageSquare, Smile, Target, CreditCard, Link as LinkIcon, LucideIcon, Users, BookOpen } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OnlineCollaborators from "./OnlineCollaborators";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatures } from "@/contexts/FeaturesContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NavItem as DbNavItem } from "@/pages/NavigationSettingsPage";

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

const Icons = LucideIcons as unknown as { [key: string]: LucideIcons.LucideIcon };

const NavLink = ({ item, isCollapsed, location }: { item: NavItem, isCollapsed: boolean, location: any }) => {
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={item.href}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8 relative",
              location.pathname.startsWith(item.href) && item.href !== '/' || location.pathname === item.href ? "bg-muted text-primary" : ""
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
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary group",
        location.pathname.startsWith(item.href) && item.href !== '/' || location.pathname === item.href ? "bg-muted text-primary" : ""
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

const SortableItem = ({ item, isCollapsed, location }: { item: NavItem, isCollapsed: boolean, location: any }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab">
      <NavLink item={item} isCollapsed={isCollapsed} location={location} />
    </div>
  );
};

const PortalSidebar = ({ isCollapsed, onToggle }: PortalSidebarProps) => {
  const { user, refreshUser, hasPermission } = useAuth();
  const location = useLocation();
  const { isFeatureEnabled } = useFeatures();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const { unreadCount: unreadNotificationCount } = useNotifications();
  const queryClient = useQueryClient();

  const totalUnreadChatCount = 0;

  const { data: customNavItems } = useQuery({
    queryKey: ['user_navigation_items', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_navigation_items')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });
      if (error) {
        console.error("Error fetching custom nav items:", error);
        return [];
      }
      return data as DbNavItem[];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-nav-items:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_navigation_items',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user_navigation_items', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  useEffect(() => {
    if (!user) return;

    const defaultItemsList: NavItem[] = [
      { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: Home },
      { id: "projects", href: "/projects", label: "Projects", icon: Package },
      { id: "request", href: "/request", label: "Request", icon: LayoutGrid },
      { id: "chat", href: "/chat", label: "Chat", icon: MessageSquare, badge: totalUnreadChatCount > 0 ? totalUnreadChatCount : undefined },
      { id: "mood-tracker", href: "/mood-tracker", label: "Mood Tracker", icon: Smile },
      { id: "goals", href: "/goals", label: "Goals", icon: Target },
      { id: "billing", href: "/billing", label: "Billing", icon: CreditCard },
      { id: "people", href: "/people", label: "People", icon: Users },
      { id: "knowledge-base", href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
      { id: "settings", href: "/settings", label: "Settings", icon: Settings },
    ];

    const visibleDefaultItems = defaultItemsList.filter(item => {
      const featureEnabled = isFeatureEnabled(item.id);
      if (!featureEnabled) return false;
      return hasPermission(`module:${item.id}`);
    });

    const customItems: NavItem[] = (customNavItems || [])
      .filter(item => item.is_enabled)
      .map(item => {
        const IconComponent = item.icon ? Icons[item.icon] : LinkIcon;
        return {
          id: item.id,
          href: `/custom?url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(item.name)}`,
          label: item.name,
          icon: IconComponent || LinkIcon,
          isCustom: true,
        };
      });

    const allAvailableItems = [...visibleDefaultItems, ...customItems];
    const itemsById = new Map(allAvailableItems.map(item => [item.id, item]));
    
    let savedOrder: string[] = [];
    try {
        const localOrder = localStorage.getItem(`sidebar_order_${user.id}`);
        if (localOrder) {
            savedOrder = JSON.parse(localOrder);
        } else {
            savedOrder = user.sidebar_order || [];
        }
    } catch (e) {
        console.error("Failed to parse sidebar order from local storage", e);
        savedOrder = user.sidebar_order || [];
    }
    
    const ordered = savedOrder
      .map(id => itemsById.get(id))
      .filter((i): i is NavItem => !!i);
      
    const newItems = allAvailableItems.filter(item => !savedOrder.includes(item.id));
    
    setNavItems([...ordered, ...newItems]);

  }, [user, isFeatureEnabled, totalUnreadChatCount, unreadNotificationCount, hasPermission, customNavItems]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldNavItems = [...navItems];
      const activeIndex = navItems.findIndex(i => i.id === active.id);
      const overIndex = navItems.findIndex(i => i.id === over.id);
      
      if (activeIndex === -1 || overIndex === -1) return;

      const newArray = arrayMove(navItems, activeIndex, overIndex);
      setNavItems(newArray);
      
      if (user) {
        const newOrder = newArray.map(item => item.id);
        
        try {
            localStorage.setItem(`sidebar_order_${user.id}`, JSON.stringify(newOrder));
        } catch (e) {
            toast.error("Could not save sidebar order locally.");
            setNavItems(oldNavItems);
            return;
        }

        const { error } = await supabase
          .from('profiles')
          .update({ sidebar_order: newOrder })
          .eq('id', user.id);
        
        if (error) {
          toast.warning("Sidebar order saved locally, but failed to sync with the server.", { description: error.message });
        } else {
          await refreshUser();
        }
      }
    }
  }

  if (!user) {
    return null;
  }

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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={navItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <nav
                  className={cn(
                    "grid items-start gap-1 text-sm font-medium",
                    isCollapsed ? "px-2" : "px-2 lg:px-4"
                  )}
                >
                  {navItems.map((item) => (
                    <SortableItem key={item.id} item={item} isCollapsed={isCollapsed} location={location} />
                  ))}
                </nav>
              </SortableContext>
            </DndContext>
          </TooltipProvider>
        </div>
        <div className="mt-auto border-t">
          <OnlineCollaborators isCollapsed={isCollapsed} />
        </div>
      </div>
    </div>
  );
};

export default PortalSidebar;