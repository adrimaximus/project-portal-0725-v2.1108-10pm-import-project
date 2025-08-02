import { useNavigate } from "react-router-dom";
import { Menu, Search, Building } from "lucide-react";
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
import { useUser } from "@/contexts/UserContext";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useState, useMemo } from "react";
import { dummyProjects } from "@/data/projects";
import { allUsers } from "@/data/users";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import HighlightMatch from "./HighlightMatch";

const PortalHeader = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const displayedContent = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (query) {
      const projects = dummyProjects.filter(p =>
        p.name.toLowerCase().includes(query)
      );
      const users = allUsers.filter(u =>
        u.name.toLowerCase().includes(query)
      );
      return { projects, users };
    }

    return {
      projects: dummyProjects.slice(0, 2),
      users: allUsers.slice(0, 2),
    };
  }, [searchQuery]);

  const handleProjectSelect = (projectId: string) => {
    navigate(`/projects/${projectId}`);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleUserSelect = (userName: string) => {
    console.log("Selected user:", userName);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
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
        <form onSubmit={handleSearchSubmit}>
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <div className="relative md:w-2/3 lg:w-1/3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search projects or users..."
                  className="w-full appearance-none bg-muted pl-8 shadow-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={() => setIsSearchOpen(true)}
                  onFocus={() => setIsSearchOpen(true)}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command>
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
              </Command>
            </PopoverContent>
          </Popover>
        </form>
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
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default PortalHeader;