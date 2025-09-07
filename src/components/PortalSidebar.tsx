import { useState, useEffect, useMemo } from "react";
import { Bell, Home, Package, Settings, LayoutGrid, MessageSquare, Smile, Target, CreditCard, Link as LinkIcon, LucideIcon, Users, BookOpen, Folder as FolderIcon, ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import OnlineCollaborators from "./OnlineCollaborators";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatures } from "@/contexts/FeaturesContext";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { NavItem as DbNavItem, NavFolder } from "@/pages/NavigationSettingsPage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

type PortalSidebarProps = { isCollapsed: boolean; onToggle: () => void; };
type NavItem = { id: string; href: string; label: string; icon: LucideIcon; badge?: number; folder_id: string | null; };

const Icons = LucideIcons as unknown as { [key: string]: LucideIcons.LucideIcon };

const NavLink = ({ item, isCollapsed, location }: { item: NavItem, isCollapsed: boolean, location: any }) => {
  const isActive = location.pathname.startsWith(item.href) && (item.href !== '/' && item.href !== '/dashboard') || location.pathname === item.href;
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={item.href} className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8 relative", isActive && "bg-muted text-primary")}>
            <item.icon className="h-5 w-5" />
            <span className="sr-only">{item.label}</span>
            {item.badge && <Badge className="absolute -top-1 -right-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full p-0 text-xs">{item.badge}</Badge>}
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
      {item.badge && <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">{item.badge}</Badge>}
    </Link>
  );
};

const PortalSidebar = ({ isCollapsed, onToggle }: PortalSidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const { unreadCount: unreadNotificationCount } = useNotifications();
  const queryClient = useQueryClient();
  const totalUnreadChatCount = 0; // Placeholder for chat unread count

  const { data: customNavItems = [] } = useQuery({ queryKey: ['user_navigation_items', user?.id], queryFn: async () => { if (!user) return []; const { data, error } = await supabase.from('user_navigation_items').select('*').eq('user_id', user.id).order('position'); if (error) return []; return data as DbNavItem[]; }, enabled: !!user });
  const { data: folders = [] } = useQuery({ queryKey: ['navigation_folders', user?.id], queryFn: async () => { if (!user) return []; const { data, error } = await supabase.from('navigation_folders').select('*').eq('user_id', user.id).order('position'); if (error) return []; return data as NavFolder[]; }, enabled: !!user });

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`user-nav-items:${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'user_navigation_items', filter: `user_id=eq.${user.id}` }, () => queryClient.invalidateQueries({ queryKey: ['user_navigation_items', user.id] })).on('postgres_changes', { event: '*', schema: 'public', table: 'navigation_folders', filter: `user_id=eq.${user.id}` }, () => queryClient.invalidateQueries({ queryKey: ['navigation_folders', user.id] })).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const { navItems, settingsItem } = useMemo(() => {
    const allItems = customNavItems
      .filter(item => item.is_enabled)
      .map(item => {
        const isEmbed = !item.url.startsWith('/');
        let href = isEmbed ? `/custom?url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(item.name)}` : item.url;
        let badge;

        if (href === '/') {
          href = '/dashboard';
        }

        // Fix for incorrect URLs from database
        const itemNameLower = item.name.toLowerCase();
        if (itemNameLower === 'knowledge base' && href !== '/knowledge-base') {
            href = '/knowledge-base';
        }
        if (itemNameLower === 'requests' && href !== '/request') {
            href = '/request';
        }
        if (itemNameLower === 'mood trackers' && href !== '/mood-tracker') {
            href = '/mood-tracker';
        }

        if (itemNameLower === 'chat') badge = totalUnreadChatCount > 0 ? totalUnreadChatCount : undefined;
        if (itemNameLower === 'notifications') badge = unreadNotificationCount > 0 ? unreadNotificationCount : undefined;
        
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
  }, [customNavItems, totalUnreadChatCount, unreadNotificationCount]);

  const topLevelItems = useMemo(() => navItems.filter(item => !item.folder_id), [navItems]);

  if (!user) return null;

  return (
    <div className="h-screen border-r bg-muted/40 transition-all duration-300 ease-in-out" onDoubleClick={onToggle}>
      <div className="flex h-full max-h-screen flex-col">
        <div className={cn("flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6", isCollapsed && "justify-center px-2")}>
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold" title="Client Portal"><Package className="h-6 w-6" /><span className={cn(isCollapsed && "sr-only")}>Client Portal</span></Link>
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto py-2">
            <TooltipProvider delayDuration={0}>
              <nav className={cn("grid items-start gap-1 text-sm font-medium", isCollapsed ? "px-2" : "px-2 lg:px-4")}>
                {topLevelItems.map(item => <NavLink key={item.id} item={item} isCollapsed={isCollapsed} location={location} />)}
                {folders.map(folder => {
                  const itemsInFolder = navItems.filter(item => item.folder_id === folder.id);
                  if (itemsInFolder.length === 0) return null;
                  const FolderIconComponent = folder.icon ? Icons[folder.icon] : FolderIcon;
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
                        {itemsInFolder.map(item => <NavLink key={item.id} item={item} isCollapsed={isCollapsed} location={location} />)}
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
                  <NavLink item={settingsItem} isCollapsed={isCollapsed} location={location} />
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