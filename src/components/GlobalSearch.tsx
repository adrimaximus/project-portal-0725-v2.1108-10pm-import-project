import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProjects, Project, User } from "@/data/projects";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FileText, User as UserIcon } from "lucide-react";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const uniqueUsers: User[] = useMemo(() => {
    const allUsers = dummyProjects.flatMap(p => [p.createdBy, ...p.assignedTo]);
    return [...new Map(allUsers.map(item => [item.id, item])).values()];
  }, []);

  const filteredProjects = query.length > 1
    ? dummyProjects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredUsers = query.length > 1
    ? uniqueUsers.filter(u => u.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSelectProject = (project: Project) => {
    setOpen(false);
    navigate(`/projects/${project.id}`);
  };

  const handleSelectUser = (user: User) => {
    setOpen(false);
    // You might want to navigate to a user profile page
    console.log("Selected user:", user);
  };

  return (
    <>
      <p className="text-sm text-muted-foreground cursor-pointer" onClick={() => setOpen(true)}>
        Search...
        <kbd className="pointer-events-none ml-4 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </p>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search for projects or users..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {filteredProjects.length > 0 && (
            <CommandGroup heading="Projects">
              {filteredProjects.map(project => (
                <CommandItem
                  key={project.id}
                  onSelect={() => handleSelectProject(project)}
                  value={`project-${project.name}`}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{project.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {filteredUsers.length > 0 && (
            <CommandGroup heading="Users">
              {filteredUsers.map(user => (
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
      </CommandDialog>
    </>
  );
}