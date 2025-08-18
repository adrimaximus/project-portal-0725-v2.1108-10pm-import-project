import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Project, User } from "@/types";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { FileText, User as UserIcon, Trophy, Sparkles, Search as SearchIcon, CreditCard } from "lucide-react";
import debounce from 'lodash.debounce';

type Goal = { id: string; title: string; slug: string; };
type Bill = { id: string; name: string; slug: string; payment_status: string };

type SearchResults = {
  projects: Pick<Project, 'id' | 'name' | 'slug'>[];
  users: Pick<User, 'id' | 'name'>[];
  goals: Goal[];
  bills: Bill[];
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ projects: [], users: [], goals: [], bills: [] });
  const [loading, setLoading] = useState(false);
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

  const performSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults({ projects: [], users: [], goals: [], bills: [] });
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const [projectsRes, usersRes, goalsRes, billsRes] = await Promise.all([
        supabase.from('projects').select('id, name, slug').ilike('name', `%${searchQuery}%`).limit(5),
        supabase.from('profiles').select('id, first_name, last_name, email').or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`).limit(5),
        supabase.from('goals').select('id, title, slug').ilike('title', `%${searchQuery}%`).limit(5),
        supabase.from('projects').select('id, name, slug, payment_status').in('payment_status', ['Unpaid', 'Overdue']).ilike('name', `%${searchQuery}%`).limit(5)
      ]);

      const projects = projectsRes.data || [];
      const users = (usersRes.data || []).map(p => ({
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email,
      }));
      const goals = goalsRes.data || [];
      const bills = billsRes.data || [];

      setResults({ projects, users, goals, bills });
    } catch (error) {
      console.error("Error performing search:", error);
      setResults({ projects: [], users: [], goals: [], bills: [] });
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(performSearch, 300), []);

  useEffect(() => {
    if (query) {
      setLoading(true);
      debouncedSearch(query);
    } else {
      setResults({ projects: [], users: [], goals: [], bills: [] });
      setLoading(false);
      debouncedSearch.cancel();
    }
  }, [query, debouncedSearch]);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    setQuery("");
    callback();
  };

  const hasResults = results.projects.length > 0 || results.users.length > 0 || results.goals.length > 0 || results.bills.length > 0;

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="h-4 w-4 mr-2" />
        <span className="hidden lg:inline-flex">Search or ask AI...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search for projects, users, goals or ask AI..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && <CommandEmpty>Searching...</CommandEmpty>}
          {!loading && !hasResults && query.length > 1 && <CommandEmpty>No results found.</CommandEmpty>}
          
          {query.length > 1 && (
            <CommandGroup heading="AI Assistant">
              <CommandItem
                onSelect={() => handleSelect(() => navigate(`/ai-chat?q=${encodeURIComponent(query)}`))}
                value={`ai-${query}`}
                className="cursor-pointer"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Ask AI: "{query}"</span>
              </CommandItem>
            </CommandGroup>
          )}

          {results.projects.length > 0 && (
            <CommandGroup heading="Projects">
              {results.projects.map(project => (
                <CommandItem
                  key={project.id}
                  onSelect={() => handleSelect(() => navigate(`/projects/${project.slug}`))}
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
              {results.users.map(user => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleSelect(() => navigate(`/users/${user.id}`))}
                  value={`user-${user.name}`}
                  className="cursor-pointer"
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>{user.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.goals.length > 0 && (
            <CommandGroup heading="Goals">
              {results.goals.map(goal => (
                <CommandItem
                  key={goal.id}
                  onSelect={() => handleSelect(() => navigate(`/goals/${goal.slug}`))}
                  value={`goal-${goal.title}`}
                  className="cursor-pointer"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  <span>{goal.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.bills.length > 0 && (
            <CommandGroup heading="Bills">
              {results.bills.map(bill => (
                <CommandItem
                  key={bill.id}
                  onSelect={() => handleSelect(() => navigate(`/projects/${bill.slug}?tab=billing`))}
                  value={`bill-${bill.name}`}
                  className="cursor-pointer"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>{bill.name} ({bill.payment_status})</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}