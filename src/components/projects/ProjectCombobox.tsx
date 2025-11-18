import * as React from "react"
import { Check, ChevronsUpDown, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Project } from "@/types"
import { useAuth } from "@/contexts/AuthContext"

interface ProjectComboboxProps {
  projects: Project[];
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ProjectCombobox({ projects, value, onChange, isLoading, disabled }: ProjectComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const { user } = useAuth();

  const { personalProject, generalTasksProject, sortedProjects } = React.useMemo(() => {
    const personal = projects.find(p => p.personal_for_user_id === user?.id);
    const general = projects.find(p => p.slug === 'general-tasks');
    const otherProjects = projects
      .filter(p => p.personal_for_user_id !== user?.id && p.slug !== 'general-tasks')
      .sort((a, b) => a.name.localeCompare(b.name));
    return { personalProject: personal, generalTasksProject: general, sortedProjects: otherProjects };
  }, [projects, user]);

  const selectedProject = projects.find(
    (project) => project.id === value
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading || disabled}
        >
          {isLoading ? "Loading projects..." : (
            value && selectedProject
              ? selectedProject.name
              : "Select a project..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search project..." />
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup className="max-h-72 overflow-y-auto">
              {personalProject && (
                <CommandItem
                  key={personalProject.id}
                  value={personalProject.name}
                  onSelect={() => {
                    onChange(personalProject.id)
                    setOpen(false)
                  }}
                  className="flex items-center"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === personalProject.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  {personalProject.name}
                </CommandItem>
              )}
              {generalTasksProject && (
                <CommandItem
                  key={generalTasksProject.id}
                  value={generalTasksProject.name}
                  onSelect={() => {
                    onChange(generalTasksProject.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === generalTasksProject.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {generalTasksProject.name}
                </CommandItem>
              )}
              {(personalProject || generalTasksProject) && sortedProjects.length > 0 && <CommandSeparator />}
              {sortedProjects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={() => {
                    onChange(project.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === project.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {project.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}