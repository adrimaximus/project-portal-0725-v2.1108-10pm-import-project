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
import { FileText, ListChecks, Users } from "lucide-react";

interface Task {
  id: string;
  title: string;
  project_slug: string;
}

export function GlobalCommand() {
  const [open, setOpen] = React.useState(false);
  const [tasks, setTasks] = React.useState<Task[]>([]);
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
      return;
    }

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .rpc('get_project_tasks', { p_limit: 5, p_completed: false, p_order_by: 'created_at', p_order_direction: 'desc' });
      
      if (error) {
        console.error("Error fetching tasks:", error);
      } else if (data) {
        setTasks(data as Task[]);
      }
    };

    fetchTasks();
  }, [open]);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
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
        {tasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recent Tasks">
              {tasks.map((task) => (
                <CommandItem
                  key={task.id}
                  onSelect={() => runCommand(() => navigate(`/projects/${task.project_slug}?task=${task.id}`))}
                  value={`task-${task.id}-${task.title}`}
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  <span>{task.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}