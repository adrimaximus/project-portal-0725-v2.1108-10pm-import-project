import * as React from "react"
import { Check, ChevronsUpDown, User, Briefcase } from "lucide-react"

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

  const { personalProject, generalTasksProject, groupedProjects } = React.useMemo(() => {
    const personal = projects.find(p => p.personal_for_user_id === user?.id);
    const general = projects.find(p => p.slug === 'general-tasks');
    
    const otherProjects = projects
      .filter(p => p.personal_for_user_id !== user?.id && p.slug !== 'general-tasks');

    const grouped = otherProjects.reduce((acc, project) => {
      const category = project.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(project);
      return acc;
    }, {} as Record<string, Project[]>);

    for (const category in grouped) {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    }

    const sortedGroupedProjects = Object.entries(grouped).sort(([catA], [catB]) => {
        if (catA === 'Uncategorized') return 1;
        if (catB === 'Uncategorized') return -1;
        return catA.localeCompare(catB);
    });

    return { personalProject: personal, generalTasksProject: general, groupedProjects: sortedGroupedProjects };
  }, [projects, user]);

  const selectedProject = projects.find(
    (project) => project.id === value
  )

  const filter = (value: string, search: string) => {
    if (value.toLowerCase().includes(search.toLowerCase())) return 1
    return 0
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto whitespace-normal text-left"
          disabled={isLoading || disabled}
        >
          <span className="truncate flex-1">
            {isLoading ? "Loading projects..." : (
              value && selectedProject
                ? selectedProject.name
                : "Select a project..."
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command filter={filter}>
          <CommandInput placeholder="Search project..." />
          <CommandList className="max-h-72">
            <CommandEmpty>No project found.</CommandEmpty>
            
            {(personalProject || generalTasksProject) && (
              <CommandGroup>
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
              </CommandGroup>
            )}
            
            {(personalProject || generalTasksProject) && groupedProjects.length > 0 && <CommandSeparator />}
            
            {groupedProjects.map(([category, projectsInCategory]) => (
              <CommandGroup key={category} heading={category}>
                {projectsInCategory.map((project) => (
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
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                    {project.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}