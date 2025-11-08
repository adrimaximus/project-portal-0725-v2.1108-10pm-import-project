import { useState, useEffect, useMemo, useRef } from "react";
import { Bell, Home, Settings, LayoutGrid, MessageSquare, Smile, Target, CreditCard, Link as LinkIcon, LucideIcon, Users, BookOpen, Folder as FolderIcon, ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import OnlineCollaborators from "./OnlineCollaborators";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NavItem as DbNavItem, NavFolder } from "@/pages/NavigationSettingsPage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { toast } from "sonner";
import { useChatContext } from "@/contexts/ChatContext";

type PortalSidebarProps = { isCollapsed: boolean; onToggle: () => void; };
type NavItem = { id: string; href: string; label: string; icon: LucideIcon; badge?: number; folder_id: string | null; };

const Icons = LucideIcons as unknown as { [key: string]: LucideIcons.LucideIcon };

const NavLink = ({ item, isCollapsed }: { item: NavItem, isCollapsed: boolean }) => {
  const location = useLocation();
  const [itemPath, itemQuery] = item.href.split('?');
  
  let isActive = false;
  if (itemQuery) {
      isActive = location.pathname === itemPath && location.search === `?${itemQuery}`;
  } else {
      if (location.pathname.startsWith(itemPath) && itemPath !== '/') {
          const isCompetingQueryLinkActive = location.pathname === itemPath && location.search;
          if (isCompetingQueryLinkActive) {
              isActive = false;
          } else {
              isActive = true;
          }
      } else {
          isActive = location.pathname === itemPath;
      }
  }

  if (item.href === '/dashboard' && location.pathname === '/') {
      isActive = true;
  }

  const isChatLink = item.label.toLowerCase() === 'chat';
  const isNotificationsLink = item.label.toLowerCase() === 'notifications';

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={item.href} className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8 relative", isActive && "bg-muted text-primary")}>
            <item.icon className="h-5 w-5" />
            <span className="sr-only">{item.label}</span>
            {(isChatLink || isNotificationsLink) && item.badge ? (
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-1 ring-background" />
            ) : (
              item.badge && <Badge className="absolute -top-1 -right-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full p-0 text-xs">{item.badge}</Badge>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return (
    <Link to={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary group", isActive && "bg-muted text-primary")}>
      <item.icon className="h-4 w-4" />
      {item.label}
      {(isChatLink || isNotificationsLink) && item.badge ? (
        <span className="ml-auto block h-2 w-2 rounded-full bg-red-500" />
      ) : (
        item.badge && <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">{item.badge}</Badge>
      )}
    </Link>
  );
};

const PortalSidebar = ({ isCollapsed, onToggle }: PortalSidebarProps) => {
  const { user, hasPermission } = useAuth();
  const { hasImportantUnread } = useNotifications();
  const { unreadConversationIds } = useChatContext();
  const queryClient = useQueryClient();
  const backfillAttempted = useRef(false);

  const { data: customNavItems = [], isLoading: isLoadingItems, error: navItemsError, refetch } = useQuery({ 
    queryKey: ['user_navigation_items', user?.id], 
    queryFn: async () => { 
      if (!user) return []; 
      const { data, error } = await supabase.rpc('get_user_navigation_items');
      if (error) {
        console.error("Error fetching navigation items:", error);
        return [];
      }
      return data as DbNavItem[]; 
    }, 
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (user && !isLoadingItems && customNavItems.length === 0 && !backfillAttempted.current) {
      backfillAttempted.current = true; // Attempt only once per session
      const backfill = async () => {
        console.log("No navigation items found for user, attempting to backfill...");
        const { error } = await supabase.rpc('ensure_user_navigation_items', { p_user_id: user.id });
        if (error) {
          toast.error("Could not set up default navigation.", { description: error.message });
        } else {
          toast.info("Setting up your navigation menu...");
          refetch();
        }
      };
      backfill();
    }
  }, [user, isLoadingItems, customNavItems, refetch]);

  const { data: folders = [], error: foldersError } = useQuery({ 
    queryKey: ['navigation_folders', user?.id], 
    queryFn: async () => { 
      if (!user) return []; 
      const { data, error } = await supabase.from('navigation_folders').select('*').eq('user_id', user.id).order('position'); 
      if (error) {
        console.error("Error fetching navigation folders:", error);
        return [];
      }
      return data as NavFolder[]; 
    }, 
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`user-nav-items:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_navigation_items', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['user_navigation_items', user.id] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'navigation_folders', filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['navigation_folders', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const navItemToPermissionId = (itemName: string): string | null => {
    const mapping: { [key: string]: string } = {
        'dashboard': 'module:dashboard',
        'projects': 'module:projects',
        'tasks': 'module:projects',
        'requests': 'module:request',
        'chat': 'module:chat',
        'mood trackers': 'module:mood-tracker',
        'goals': 'module:goals',
        'billing': 'module:billing',
        'people': 'module:people',
        'knowledge base': 'module:knowledge-base',
        'settings': 'module:settings',
    };
    return mapping[itemName.toLowerCase()] || null;
  };

  const { navItems, settingsItem } = useMemo(() => {
    const hasUnreadChat = unreadConversationIds.size > 0;

    if (navItemsError || foldersError) {
      console.warn("Using fallback navigation due to errors:", { navItemsError, foldersError });
      return {
        navItems: [
          { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: Home, folder_id: null },
          { id: 'projects', href: '/projects?view=list', label: 'Projects', icon: LayoutGrid, folder_id: null },
          { id: 'chat', href: '/chat', label: 'Chat', icon: MessageSquare, badge: hasUnreadChat ? 1 : undefined, folder_id: null },
          { id: 'goals', href: '/goals', label: 'Goals', icon: Target, folder_id: null },
          { id: 'people', href: '/people', label: 'People', icon: Users, folder_id: null },
        ],
        settingsItem: { id: 'settings', href: '/settings', label: 'Settings', icon: Settings, folder_id: null }
      };
    }

    const allItems = customNavItems
      .filter(item => item.is_enabled)
      .filter(item => {
        if (item.is_deletable === false) {
          const permissionId = navItemToPermissionId(item.name);
          return permissionId ? hasPermission(permissionId) : true;
        }
        return true;
      })
      .map(item => {
        let href: string;
        let badge;

        if (item.type === 'multi_embed') {
          href = `/multipage/${item.slug}`;
        } else if (item.url.startsWith('/')) {
          href = item.url;
        } else if (item.url.startsWith('<iframe') || item.url.startsWith('http')) {
          href = `/custom/${item.slug}`;
        } else {
          href = `/custom/${item.slug}`;
        }

        if (href === '/') {
          href = '/dashboard';
        }

        const itemNameLower = item.name.toLowerCase();
        if (itemNameLower === 'projects') {
            href = '/projects?view=list';
        }
        if (itemNameLower === 'tasks') {
            href = '/projects?view=tasks-kanban';
        }
        if (itemNameLower === 'knowledge base' && href !== '/knowledge-base') {
            href = '/knowledge-base';
        }
        if (itemNameLower === 'requests' && href !== '/request') {
            href = '/request';
        }
        if (itemNameLower === 'mood trackers' && href !== '/mood-tracker') {
            href = '/mood-tracker';
        }

        if (itemNameLower === 'chat') badge = hasUnreadChat ? 1 : undefined;
        if (itemNameLower === 'notifications') badge = hasImportantUnread ? 1 : undefined;
        
        return {
          id: item.id,
          href: href,
          label: item.name,
          icon: item.icon ? Icons[item.icon] || LinkIcon : LinkIcon,
          folder_id: item.folder_id,
          badge,
        };
      });
      
    const settings = allItems.find(item => item.href === '/settings');
    const otherItems = allItems.filter(item => item.href !== '/settings');

    return { navItems: otherItems, settingsItem: settings };
  }, [customNavItems, hasImportantUnread, navItemsError, foldersError, hasPermission, unreadConversationIds]);

  const topLevelItems = useMemo(() => navItems.filter(item => !item.folder_id), [navItems]);

  if (!user) return null;

  return (
    <div className="h-screen border-r bg-muted/40 transition-all duration-300 ease-in-out" onDoubleClick={onToggle}>
      <div className="flex h-full max-h-screen flex-col">
        <div className={cn("flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6", isCollapsed && "justify-center px-2")}>
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold" title="7i Portal">
            <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png" alt="7i Portal Logo" className="h-8 w-8" />
            <span className={cn(isCollapsed && "sr-only")}>7i Portal</span>
          </Link>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto py-2">
            <TooltipProvider delayDuration={0}>
              <nav className={cn("grid items-start gap-1 text-sm font-medium", isCollapsed ? "px-2" : "px-2 lg:px-4")}>
                {topLevelItems.map(item => <NavLink key={item.id} item={item} isCollapsed={isCollapsed} />)}
                {!navItemsError && !foldersError && folders.map(folder => {
                  const itemsInFolder = navItems.filter(item => item.folder_id === folder.id);
                  if (itemsInFolder.length === 0) return null;
                  const FolderIconComponent = folder.icon && Icons[folder.icon] ? Icons[folder.icon] : FolderIcon;
                  return (
                    <Collapsible key={folder.id} defaultOpen>
                      <CollapsibleTrigger className="w-full group">
                        <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isCollapsed && "justify-center")}>
                          <FolderIconComponent className="h-4 w-4" style={{ color: folder.color || undefined }} />
                          {!isCollapsed && <span className="flex-1 text-left">{folder.name}</span>}
                          {!isCollapsed && <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className={cn("space-y-1", !isCollapsed && "pl-4")}>
                        {itemsInFolder.map(item => <NavLink key={item.id} item={item} isCollapsed={isCollapsed} />)}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </nav>
            </TooltipProvider>
          </div>
          {settingsItem && (
            <div className="mt-auto border-t p-2">
              <TooltipProvider delayDuration={0}>
                <nav className={cn("grid items-start gap-1 text-sm font-medium", isCollapsed ? "px-2" : "px-2 lg:px-4")}>
                  <NavLink item={settingsItem} isCollapsed={isCollapsed} />
                </nav>
              </TooltipProvider>
            </div>
          )}
        </div>
        <div className="border-t"><OnlineCollaborators isCollapsed={isCollapsed} /></div>
      </div>
    </div>
  );
};

export default PortalSidebar;