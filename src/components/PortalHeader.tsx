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

const PortalHeader = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (searchQuery.length > 1) {
      const projects = dummyProjects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      const users = allUsers.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { projects, users };
    }
    return { projects: [], users: [] };
  }, [searchQuery]);

  const suggestions = useMemo(() => {
    if (searchQuery.length <= 1) {
      return {
        projects: dummyProjects.slice(0, 2),
        users: allUsers.slice(0, 2),
      };
    }
    return { projects: [], users: [] };
  }, [searchQuery]);

  const handleProjectSelect = (projectId: string) => {
    navigate(`/projects/${projectId}`);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleUserSelect = (userName: string) => {
    // Since user profile pages don't exist yet, we'll just log the selection.
    console.log("Selected user:", userName);
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const showSearchResults = searchQuery.length > 1;
  const showSuggestions = !showSearchResults;

  const isPopoverVisible = isSearchOpen && (
    (showSearchResults && (searchResults.projects.length > 0 || searchResults.users.length > 0)) ||
    (showSuggestions && (suggestions.projects.length > 0 || suggestions.users.length > 0))
  );

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
        <Popover open={isPopoverVisible} onOpenChange={setIsSearchOpen}>
          <PopoverTrigger asChild>
            <div className="relative md:w-2/3 lg:w-1/3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects or users..."
                className="w-full appearance-none bg-muted pl-8 shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                
                {showSearchResults && searchResults.projects.length > 0 && (
                  <CommandGroup heading="Projects">
                    {searchResults.projects.map((project) => (
                      <CommandItem
                        key={project.id}
                        onSelect={() => handleProjectSelect(project.id)}
                        className="cursor-pointer"
                      >
                        <Building className="mr-2 h-4 w-4" />
                        <span>{project.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                
                {showSearchResults && searchResults.users.length > 0 && (
                  <CommandGroup heading="Users">
                    {searchResults.users.map((userResult) => (
                      <CommandItem
                        key={userResult.id}
                        onSelect={() => handleUserSelect(userResult.name)}
                        className="cursor-pointer flex items-center"
                      >
                        <Avatar className="mr-2 h-6 w-6">
                          <AvatarImage src={userResult.avatar} />
                          <AvatarFallback>{userResult.initials}</AvatarFallback>
                        </Avatar>
                        <span>{userResult.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {showSuggestions && (
                  <CommandGroup heading="Suggestions">
                    {suggestions.projects.map((project) => (
                      <CommandItem
                        key={`sugg-proj-${project.id}`}
                        onSelect={() => handleProjectSelect(project.id)}
                        className="cursor-pointer"
                      >
                        <Building className="mr-2 h-4 w-4" />
                        <span>{project.name}</span>
                      </CommandItem>
                    ))}
                    {suggestions.users.map((userResult) => (
                      <CommandItem
                        key={`sugg-user-${userResult.id}`}
                        onSelect={() => handleUserSelect(userResult.name)}
                        className="cursor-pointer flex items-center"
                      >
                        <Avatar className="mr-2 h-6 w-6">
                          <AvatarImage src={userResult.avatar} />
                          <AvatarFallback>{userResult.initials}</AvatarFallback>
                        </Avatar>
                        <span>{userResult.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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