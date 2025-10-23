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
import { FileText, ListChecks, Loader2, Users } from "lucide-react";

interface Task {
  id: string;
  title: string;
  project_slug: string;
  project_name: string;
}

export function GlobalCommand() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [results, setResults] = React.useState<Task[]>([]);
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
      setResults([]);
      return;
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const fetchResults = async () => {
      setLoading(true);
      
      if (search.trim() === "") {
        const { data, error } = await supabase
          .rpc('get_project_tasks', { p_limit: 5, p_completed: false, p_order_by: 'created_at', p_order_direction: 'desc' });
        
        if (error) {
          console.error("Error fetching recent tasks:", error);
          setResults([]);
        } else if (data) {
          setResults(data as Task[]);
        }
      } else {
        const { data, error } = await supabase
          .rpc('search_tasks', { p_search_term: search, p_limit: 10 });

        if (error) {
          console.error("Error searching tasks:", error);
          setResults([]);
        } else if (data) {
          setResults(data as Task[]);
        }
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

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Type a command or search for tasks..." 
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
        
        {(results.length > 0 || loading) && (
          <>
            <CommandSeparator />
            <CommandGroup heading={search ? "Tasks" : "Recent Tasks"}>
              {loading && results.length === 0 && (
                <div className="p-2 flex items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              )}
              {results.map((task) => (
                <CommandItem
                  key={task.id}
                  onSelect={() => runCommand(() => navigate(`/projects/${task.project_slug}?tab=tasks&task=${task.id}`))}
                  value={`task-${task.id}-${task.title}`}
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
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}