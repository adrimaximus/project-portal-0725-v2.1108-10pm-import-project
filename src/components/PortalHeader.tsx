import { useNavigate, Link } from "react-router-dom";
import { Menu, Sun, Moon, Laptop, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PortalSidebar from "./PortalSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ReactNode } from "react";
import { useTheme } from "@/contexts/ThemeProvider";
import { GlobalSearch } from "./GlobalSearch";
import { generateVibrantGradient } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "./ui/badge";
import { useFeatures } from "@/contexts/FeaturesContext";

interface PortalHeaderProps {
    summary?: ReactNode;
}

const PortalHeader = ({ summary }: PortalHeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const { isFeatureEnabled } = useFeatures();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("system");
    } else {
      setTheme("dark");
    }
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
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
        <Button variant="outline" size="icon" asChild>
          <Link to="/notifications" className="relative">
            <Bell className="h-[1.2rem] w-[1.2rem]" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
            <span className="sr-only">View notifications</span>
          </Link>
        </Button>
      )}
      <Button variant="outline" size="icon" onClick={toggleTheme}>
        {theme === 'light' && <Sun className="h-[1.2rem] w-[1.2rem]" />}
        {theme === 'dark' && <Moon className="h-[1.2rem] w-[1.2rem]" />}
        {theme === 'system' && <Laptop className="h-[1.2rem] w-[1.2rem]" />}
        <span className="sr-only">Toggle theme</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback style={generateVibrantGradient(user.id)}>{user.initials}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/profile')}>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default PortalHeader;