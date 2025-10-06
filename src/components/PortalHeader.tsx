import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  Search,
  Settings,
  User as UserIcon,
  LogOut,
  CheckCheck,
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
import PortalSidebar from "./PortalSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import GlobalSearch from "./GlobalSearch";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { ScrollArea } from "./ui/scroll-area";
import { getIconComponent } from "@/data/icons";

const PortalHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: string) => {
    const Icon = getIconComponent(type);
    return Icon ? <Icon className="h-5 w-5" /> : <Bell className="h-5 w-5" />;
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <PortalSidebar />
        </SheetContent>
      </Sheet>
      <div className="w-full flex-1">
        <GlobalSearch />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {unreadCount}
              </span>
            )}
            <span className="sr-only">Toggle notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 md:w-96">
          <div className="flex justify-between items-center p-2">
            <DropdownMenuLabel className="text-base">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="text-xs">
                <CheckCheck className="mr-1 h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          <ScrollArea className="h-80">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No new notifications</p>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  onSelect={() => {
                    if (!notification.read_at) {
                      markAsRead(notification.id);
                    }
                    navigate(notification.data?.link || '/notifications');
                  }}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  <div className="relative">
                    {getNotificationIcon(notification.type)}
                    {!notification.read_at && (
                      <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-primary ring-1 ring-background" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: id })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/notifications')} className="justify-center">
            View all notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar_url || undefined} alt={user?.name} />
              <AvatarFallback>{user?.initials}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/profile')}>
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default PortalHeader;