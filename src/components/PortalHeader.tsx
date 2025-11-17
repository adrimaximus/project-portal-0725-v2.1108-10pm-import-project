import { useState, ReactNode } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Menu, Sun, Moon, Laptop, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PortalSidebar from "./PortalSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useTheme } from "@/contexts/ThemeProvider";
import { GlobalSearch } from "./GlobalSearch";
import { generatePastelColor, getAvatarUrl, cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "./ui/badge";
import { useFeatures } from "@/contexts/FeaturesContext";
import { notificationIcons } from "@/data/notifications";
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { SupportDialog } from "./SupportDialog";
import InteractiveText from "./InteractiveText";
import { useProfiles } from "@/hooks/useProfiles";

interface PortalHeaderProps {
    summary?: ReactNode;
}

const PortalHeader = ({ summary }: PortalHeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { isFeatureEnabled } = useFeatures();
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
  const { data: allUsers = [] } = useProfiles();

  const unreadNotifications = notifications.filter(n => !n.read).slice(0, 5);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  const toggleTheme = () => {
    if (theme === 'claude' || theme === 'claude-light') {
      setTheme(theme === 'claude' ? 'claude-light' : 'claude');
    } else if (theme === 'nature' || theme === 'nature-light') {
      setTheme(theme === 'nature' ? 'nature-light' : 'nature');
    } else if (theme === 'corporate' || theme === 'corporate-light') {
      setTheme(theme === 'corporate' ? 'corporate-light' : 'corporate');
    } else if (theme === 'ahensi' || theme === 'ahensi-light') {
      setTheme(theme === 'ahensi' ? 'ahensi-light' : 'ahensi');
    } else if (theme === 'brand-activator' || theme === 'brand-activator-light') {
      setTheme(theme === 'brand-activator' ? 'brand-activator-light' : 'brand-activator');
    } else {
      if (theme === 'dark') {
        setTheme('light');
      } else if (theme === 'light') {
        setTheme('system');
      } else {
        setTheme('dark');
      }
    }
  };

  return (
    <>
      <header className="flex h-14 items-center gap-2 border-b bg-background px-2 sm:gap-4 sm:px-4 lg:h-[60px] lg:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0">
            <PortalSidebar isCollapsed={false} onToggle={() => {}} />
          </SheetContent>
        </Sheet>
        <div className="w-full flex-1">
          {summary}
        </div>
        {isFeatureEnabled('search') && <GlobalSearch />}
        {isFeatureEnabled('notifications') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full relative">
                <Bell className="h-[1.2rem] w-[1.2rem]" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
                <span className="sr-only">View notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96 max-h-[80vh] overflow-y-auto">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  You have no notifications.
                </div>
              ) : unreadCount > 0 ? (
                unreadNotifications.map(notification => {
                  const Icon = notificationIcons[notification.type as keyof typeof notificationIcons] || notificationIcons.system;
                  return (
                    <DropdownMenuItem key={notification.id} onSelect={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      navigate(notification.link || '/notifications');
                    }} className="flex items-start gap-3 p-3 cursor-pointer">
                      <Icon className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 space-y-1 min-w-0">
                        <p className="text-sm font-medium leading-none whitespace-normal"><InteractiveText text={notification.title} members={allUsers} /></p>
                        <p className="text-xs text-muted-foreground line-clamp-2"><InteractiveText text={notification.description} members={allUsers} /></p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: id })}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  )
                })
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  You're all caught up!
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/notifications')} className="justify-center">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button variant="outline" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-full">
          {(theme === 'light' || theme === 'claude-light' || theme === 'nature-light' || theme === 'corporate-light' || theme === 'ahensi-light' || theme === 'brand-activator-light') && <Sun className="h-[1.2rem] w-[1.2rem]" />}
          {(theme === 'dark' || theme === 'claude' || theme === 'nature' || theme === 'corporate' || theme === 'ahensi' || theme === 'brand-activator') && <Moon className="h-[1.2rem] w-[1.2rem]" />}
          {theme === 'system' && <Laptop className="h-[1.2rem] w-[1.2rem]" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} alt={user.name} />
                <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/profile')}>Settings</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsSupportDialogOpen(true)}>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <SupportDialog isOpen={isSupportDialogOpen} onOpenChange={setIsSupportDialogOpen} />
    </>
  );
};

export default PortalHeader;