import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Briefcase, ListChecks, Mail, MessageSquare,
  Smile, Target, CreditCard, Receipt, Users, Megaphone, BookOpen,
  Settings, LogOut, ChevronRight, Folder
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar, SidebarGroup, SidebarGroupContent
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, any> = {
  LayoutDashboard, Briefcase, ListChecks, Mail, MessageSquare,
  Smile, Target, CreditCard, Receipt, Users, Megaphone, BookOpen,
  Settings, Folder, Book: BookOpen 
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, logout } = useAuth();
  const profile = user;
  const isCollapsed = state === "collapsed";
  const [navItems, setNavItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchNavItems = async () => {
      if (!user) return;
      // Fetch navigation items from Supabase
      const { data } = await supabase
        .from('user_navigation_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_enabled', true)
        .order('position');
      
      if (data && data.length > 0) {
        setNavItems(data);
      } else {
        // Fallback if no items found (though trigger should create them)
        setNavItems([
          { name: "Dashboard", url: "/dashboard", icon: "LayoutDashboard" },
          { name: "Projects", url: "/projects", icon: "Briefcase" },
          { name: "Tasks", url: "/projects?view=tasks", icon: "ListChecks" },
          { name: "Requests", url: "/request", icon: "Mail" },
          { name: "Chat", url: "/chat", icon: "MessageSquare" },
          { name: "Mood Trackers", url: "/mood-tracker", icon: "Smile" },
          { name: "Goals", url: "/goals", icon: "Target" },
          { name: "Billing", url: "/billing", icon: "CreditCard" },
          { name: "Expense", url: "/expense", icon: "Receipt" },
          { name: "People", url: "/people", icon: "Users" },
          { name: "Publication", url: "/publication", icon: "Megaphone" },
          { name: "Knowledge Base", url: "/knowledge-base", icon: "BookOpen" },
          { name: "Settings", url: "/settings", icon: "Settings" },
        ]);
      }
    };
    fetchNavItems();
  }, [user]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-20 border-b border-sidebar-border flex flex-col justify-center px-4 bg-sidebar/50 backdrop-blur-xl">
        <Link to="/dashboard" className={cn("flex items-center gap-3 group w-full overflow-hidden transition-all outline-none", isCollapsed && "justify-center")}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 group-hover:border-purple-500/50 transition-colors shrink-0">
              <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png" alt="7i Portal Logo" className="h-6 w-6 object-contain" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 whitespace-nowrap">
                7i Portal
              </span>
            )}
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-2 py-4 scrollbar-thin scrollbar-thumb-sidebar-border">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = iconMap[item.icon] || Folder;
                return (
                  <SidebarMenuItem key={item.id || item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith(item.url)}
                      tooltip={item.name}
                      className="h-10 my-0.5 transition-all hover:translate-x-1"
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <Icon className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 bg-sidebar/30">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg border border-border/50">
                    <AvatarImage src={profile?.avatar_url || ""} alt={profile?.first_name || ""} className="object-cover" />
                    <AvatarFallback className="rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">{profile?.first_name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : "User"}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronRight className="ml-auto size-4 opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg border border-border/50">
                      <AvatarImage src={profile?.avatar_url || ""} alt={profile?.first_name || ""} className="object-cover" />
                      <AvatarFallback className="rounded-lg">{profile?.first_name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : "User"}</span>
                      <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-red-500 focus:text-red-500 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}