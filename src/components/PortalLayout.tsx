import { useState, ReactNode } from "react";
import PortalSidebar from "./PortalSidebar";
import { cn } from "@/lib/utils";
import GlobalSearch from "./GlobalSearch";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type PortalLayoutProps = {
  children: ReactNode;
  summary?: ReactNode;
  pageHeader?: ReactNode;
  disableMainScroll?: boolean;
  noPadding?: boolean;
};

const PortalLayout = ({ children, summary, pageHeader, disableMainScroll, noPadding }: PortalLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useSession();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getInitials = (email: string | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <div className="flex h-screen w-full bg-muted/40">
      {/* Desktop Sidebar: Hidden on small screens */}
      <div className="hidden sm:block">
        <PortalSidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="relative z-30 flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 sm:h-[60px] sm:px-6">
          {/* Mobile Sidebar: Uses a Sheet component */}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs p-0">
              {/* Render the existing sidebar inside the sheet */}
              <PortalSidebar isCollapsed={false} onToggle={() => {}} />
            </SheetContent>
          </Sheet>

          {summary}
          <div className="ml-auto flex items-center gap-4">
            <GlobalSearch />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                  <Avatar>
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="User avatar" />
                    <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {pageHeader}
        <main
          className={cn(
            "flex-1",
            !disableMainScroll && "overflow-y-auto",
            !noPadding && "p-4 md:p-8"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;