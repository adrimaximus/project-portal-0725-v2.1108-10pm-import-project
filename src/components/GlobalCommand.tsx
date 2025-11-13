"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "../integrations/supabase/client";
import { FileText, ListChecks, Loader2, Users, Trophy } from "lucide-react";

interface Project {
  id: string;
  name: string;
  slug: string;
}
interface User {
  id: string;
  name: string;
}
interface Goal {
  id: string;
  title: string;
  slug: string;
}
interface Task {
  id: string;
  title: string;
  project_slug: string;
  project_name: string;
}
interface SearchResults {
  projects: Project[];
  users: User[];
  goals: Goal[];
  tasks: Task[];
}

export function GlobalCommand() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [results, setResults] = React.useState<SearchResults>({ projects: [], users: [], goals: [], tasks: [] });
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setResults({ projects: [], users: [], goals: [], tasks: [] });
      return;
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const fetchResults = async () => {
      setLoading(true);
      
      if (search.trim() === "") {
        const { data: recentTasks, error: tasksError } = await supabase
          .rpc('get_project_tasks', { p_limit: 5, p_completed: false, p_order_by: 'created_at', p_order_direction: 'desc' });
        
        if (tasksError) console.error("Error fetching recent tasks:", tasksError);

        setResults({
          projects: [],
          users: [],
          goals: [],
          tasks: recentTasks || [],
        });

      } else {
        const [projectsRes, usersRes, goalsRes, tasksRes] = await Promise.all([
          supabase.rpc('search_projects', { p_search_term: search, p_limit: 5 }),
          supabase.from('profiles').select('id, first_name, last_name, email').or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`).limit(5),
          supabase.from('goals').select('id, title, slug').ilike('title', `%${search}%`).limit(5),
          supabase.rpc('search_tasks', { p_search_term: search, p_limit: 5 })
        ]);

        const projects = projectsRes.data || [];
        const users = (usersRes.data || []).map(p => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email,
        }));
        const goals = goalsRes.data || [];
        const tasks = tasksRes.data || [];

        setResults({ projects, users, goals, tasks });
      }
      setLoading(false);
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [search, open]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const hasResults = results.projects.length > 0 || results.users.length > 0 || results.goals.length > 0 || results.tasks.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>{loading ? "Searching..." : "No results found."}</CommandEmpty>
        
        {!search && (
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={() => runCommand(() => navigate('/projects'))}>
              <ListChecks className="mr-2 h-4 w-4" />
              <span>Projects</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/people'))}>
              <Users className="mr-2 h-4 w-4" />
              <span>People</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/knowledge-base'))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Knowledge Base</span>
            </CommandItem>
          </CommandGroup>
        )}
        
        {(hasResults || loading) && (
          <>
            {results.tasks.length > 0 && (
              <CommandGroup heading={search ? "Tasks" : "Recent Tasks"}>
                {results.tasks.map((task) => (
                  <CommandItem
                    key={task.id}
                    onSelect={() => runCommand(() => navigate(`/projects/${task.project_slug}?tab=tasks&task=${task.id}`))}
                    value={`task-${task.id}-${task.title}`}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center min-w-0">
                        <ListChecks className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{task.title}</span>
                      </div>
                      {task.project_name && <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{task.project_name}</span>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.projects.length > 0 && (
              <CommandGroup heading="Projects">
                {results.projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => runCommand(() => navigate(`/projects/${project.slug}`))}
                    value={`project-${project.name}`}
                    className="cursor-pointer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{project.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.users.length > 0 && (
              <CommandGroup heading="Users">
                {results.users.map((user) => (
                  <CommandItem
                    key={user.id}
                    onSelect={() => runCommand(() => navigate(`/users/${user.id}`))}
                    value={`user-${user.name}`}
                    className="cursor-pointer"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span>{user.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.goals.length > 0 && (
              <CommandGroup heading="Goals">
                {results.goals.map((goal) => (
                  <CommandItem
                    key={goal.id}
                    onSelect={() => runCommand(() => navigate(`/goals/${goal.slug}`))}
                    value={`goal-${goal.title}`}
                    className="cursor-pointer"
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    <span>{goal.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}