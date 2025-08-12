import { useNavigate } from "react-router-dom";
import { Menu, Search, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PortalSidebar from "./PortalSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useState, useMemo, useRef, useEffect } from "react";
import { dummyProjects, Project } from "@/data/projects";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import HighlightMatch from "./HighlightMatch";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

const PortalHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // For desktop, focus the input. For mobile, open the dialog.
        if (window.innerWidth < 768) {
          setIsMobileSearchOpen(true);
        } else {
          searchInputRef.current?.focus();
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*').limit(5);
      if (data) {
        const users = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'No name',
          avatar: profile.avatar_url,
          email: profile.email,
          initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
        }));
        setSuggestedUsers(users);
      }
    };
    fetchUsers();
  }, []);

  const handleLogout = async () => {
    await logout();
    // Navigation will be handled automatically by ProtectedRoute
    // when the auth state changes.
  };

  const displayedContent = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (query) {
      const projects = dummyProjects.filter(p =>
        p.name.toLowerCase().includes(query)
      );
      const users = suggestedUsers.filter(u =>
        u.name.toLowerCase().includes(query)
      );
      return { projects, users };
    }

    return {
      projects: dummyProjects.slice(0, 2),
      users: suggestedUsers.slice(0, 2),
    };
  }, [searchQuery, suggestedUsers]);

  const handleProjectSelect = (projectId: string) => {
    navigate(`/projects/${projectId}`);
    setSearchQuery("");
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleUserSelect = (userName: string) => {
    console.log("Selected user:", userName);
    setSearchQuery("");
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsMobileSearchOpen(false);
    }
  };

  const searchResults = (
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      
      {displayedContent.projects.length > 0 && (
        <CommandGroup heading={searchQuery ? "Projects" : "Suggested Projects"}>
          {displayedContent.projects.map((project) => (
            <CommandItem
              key={`proj-${project.id}`}
              onSelect={() => handleProjectSelect(project.id)}
              className="cursor-pointer"
            >
              <Building className="mr-2 h-4 w-4" />
              <HighlightMatch text={project.name} query={searchQuery} />
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      
      {displayedContent.users.length > 0 && (
        <CommandGroup heading={searchQuery ? "Users" : "Suggested Users"}>
          {displayedContent.users.map((userResult) => (
            <CommandItem
              key={`user-${userResult.id}`}
              onSelect={() => handleUserSelect(userResult.name)}
              className="cursor-pointer flex items-center"
            >
              <Avatar className="mr-2 h-6 w-6">
                <AvatarImage src={userResult.avatar} />
                <AvatarFallback>{userResult.initials}</AvatarFallback>
              </Avatar>
              <HighlightMatch text={userResult.name} query={searchQuery} />
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </CommandList>
  );

  if (!user) {
    return null;
  }

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
        {/* Mobile Search */}
        <div className="md:hidden">
          <Dialog open={isMobileSearchOpen} onOpenChange={setIsMobileSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-muted-foreground">
                <Search className="mr-2 h-4 w-4" />
                Search...
              </Button>
            </DialogTrigger>
            <DialogContent className="p-0 gap-0 top-[25%]">
              <form onSubmit={handleSearchSubmit} className="p-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-full appearance-none bg-background pl-8 shadow-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
              </form>
              <Command className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                {searchResults}
              </Command>
            </DialogContent>
          </Dialog>
        </div>

        {/* Desktop Search */}
        <div className="hidden md:block">
          <form onSubmit={handleSearchSubmit}>
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverAnchor asChild>
                <div className="relative md:w-2/3 lg:w-1/3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search..."
                    className="w-full appearance-none bg-muted pl-8 pr-16 shadow-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchOpen(true)}
                  />
                  <kbd className="absolute top-1/2 right-2.5 -translate-y-1/2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              </PopoverAnchor>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>{searchResults}</Command>
              </PopoverContent>
            </Popover>
          </form>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
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