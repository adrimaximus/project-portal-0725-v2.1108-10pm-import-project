"use client";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  Menu,
  Search,
  Plus,
  MessageSquare,
  LayoutDashboard,
  Briefcase,
  ListChecks,
  CreditCard,
  Users,
  Book,
  Settings,
  Mail,
  Smile,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { GlobalSearch } from "./GlobalSearch";
import { generatePastelColor } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { toast } from "sonner";
import OnlineCollaborators from "./OnlineCollaborators";
import { useCurrentProject } from "@/hooks/useCurrentProject";
import { useMemo } from "react";
import { useUserNavigation } from "@/hooks/useUserNavigation";

const iconMapping: { [key: string]: React.ElementType } = {
  LayoutDashboard,
  Briefcase,
  ListChecks,
  CreditCard,
  Users,
  Book,
  Settings,
  Mail,
  MessageSquare,
  Smile,
  Target,
};

const PortalHeader = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const { project } = useCurrentProject();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.read_at).length || 0;

  const { data: navItems } = useUserNavigation();

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.rpc("update_my_notification_status", {
        notification_id: notificationId,
        is_read: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error("Failed to mark notification as read: " + error.message);
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("mark_all_my_notifications_as_read");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read.");
    },
    onError: (error) => {
      toast.error("Failed to mark all as read: " + error.message);
    },
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.read_at) {
      markAsReadMutation.mutate(notification.id);
    }
    // You can add navigation logic here if needed, e.g., router.push(notification.data.link)
  };

  const activeItem = useMemo(() => {
    return navItems?.find(item => location.pathname.startsWith(item.url.split('?')[0]));
  }, [navItems, location.pathname]);

  if (!user) return null;

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-30">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Briefcase className="h-6 w-6" />
          <span className="sr-only">Acme Inc</span>
        </Link>
        {navItems?.map((item) => {
          const Icon = iconMapping[item.icon || "Briefcase"];
          return (
            <Link
              key={item.id}
              to={item.url}
              className={`transition-colors hover:text-foreground ${
                location.pathname.startsWith(item.url.split('?')[0])
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              to="#"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Briefcase className="h-6 w-6" />
              <span className="sr-only">Acme Inc</span>
            </Link>
            {navItems?.map((item) => {
              const Icon = iconMapping[item.icon || "Briefcase"];
              return (
                <Link
                  key={item.id}
                  to={item.url}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                    location.pathname.startsWith(item.url.split('?')[0])
                      ? "bg-muted text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          <GlobalSearch />
        </div>
        {project && <OnlineCollaborators projectId={project.id} />}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <div className="p-4 border-b">
              <h4 className="font-medium">Notifications</h4>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading...</p>
              ) : notifications && notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 border-b hover:bg-muted/50 cursor-pointer ${
                      !n.read_at ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  No new notifications.
                </p>
              )}
            </div>
            {notifications && notifications.length > 0 && (
              <div className="p-2 border-t">
                <Button
                  variant="link"
                  className="w-full"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  Mark all as read
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>{user.initials}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default PortalHeader;