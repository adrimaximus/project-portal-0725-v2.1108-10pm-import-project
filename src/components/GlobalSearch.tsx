import { Search, Folder, User as UserIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProjects, Project } from "@/data/projects";
import { User } from "@/types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// Get all unique users from all projects
const allUsers = dummyProjects.flatMap(p => p.assignedTo);
const uniqueUsers = Array.from(new Map(allUsers.map(user => [user.id, user])).values());

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredProjects = query.length > 1
    ? dummyProjects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredUsers = query.length > 1
    ? uniqueUsers.filter(u => u.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const hasResults = filteredProjects.length > 0 || filteredUsers.length > 0;

  useEffect(() => {
    if (query.length > 1 && hasResults) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [query, hasResults]);

  // Handle clicks outside the search component to close the suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);

  const handleSelectProject = (id: string) => {
    navigate(`/projects/${id}`);
    setIsOpen(false);
    setQuery("");
  };
  
  const handleSelectUser = (user: User) => {
    // In a real app, this could navigate to a user profile or filter projects by user.
    console.log("Selected user:", user.name);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative ml-auto flex-1 md:grow-0" ref={searchRef}>
      <Command className="overflow-visible bg-transparent">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <CommandInput
            value={query}
            onValueChange={setQuery}
            onFocus={() => {
              if (query.length > 1 && hasResults) setIsOpen(true);
            }}
            placeholder="Search projects or users..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
          />
        </div>
        {isOpen && (
          <CommandList className="absolute top-full z-50 mt-2 w-full md:w-[200px] lg:w-[336px] rounded-md border bg-popover text-popover-foreground shadow-md">
            <CommandEmpty>No results found.</CommandEmpty>
            {filteredProjects.length > 0 && (
              <CommandGroup heading="Projects">
                {filteredProjects.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => handleSelectProject(project.id.toString())}
                    value={`project-${project.name}`}
                    className="cursor-pointer"
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    <span>{project.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {filteredUsers.length > 0 && (
              <CommandGroup heading="Users">
                {filteredUsers.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => handleSelectUser(user)}
                    value={`user-${user.name}`}
                    className="cursor-pointer"
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>{user.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
};

export default GlobalSearch;