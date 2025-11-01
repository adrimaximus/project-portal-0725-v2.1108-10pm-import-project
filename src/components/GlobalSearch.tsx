import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Project, User, ConversationMessage } from "@/types";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { FileText, User as UserIcon, Trophy, Sparkles, Search as SearchIcon, CreditCard, Loader2, ListChecks, Link as LinkIcon } from "lucide-react";
import debounce from 'lodash.debounce';
import { analyzeProjects } from "@/lib/openai";
import ReactMarkdown from "react-markdown";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Goal = { id: string; title: string; slug: string; };
type Bill = { id: string; name: string; slug: string; payment_status: string };
type Task = { id: string; title: string; project_slug: string; project_name: string; };

type SearchResults = {
  projects: Pick<Project, 'id' | 'name' | 'slug'>[];
  users: Pick<User, 'id' | 'name'>[];
  goals: Goal[];
  bills: Bill[];
  tasks: Task[];
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ projects: [], users: [], goals: [], bills: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, isAiLoading]);

  const resetSearch = () => {
    setQuery("");
    setResults({ projects: [], users: [], goals: [], bills: [], tasks: [] });
    setConversation([]);
    setIsAiLoading(false);
    setLoading(false);
  };

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
      setResults({ projects: [], users: [], goals: [], bills: [], tasks: [] });
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const [projectsRes, usersRes, goalsRes, billsRes, tasksRes] = await Promise.all([
        supabase.from('projects').select('id, name, slug').ilike('name', `%${searchQuery}%`).limit(5),
        supabase.from('profiles').select('id, first_name, last_name, email').or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`).limit(5),
        supabase.from('goals').select('id, title, slug').ilike('title', `%${searchQuery}%`).limit(5),
        supabase.from('projects').select('id, name, slug, payment_status').in('payment_status', ['Unpaid', 'Overdue']).ilike('name', `%${searchQuery}%`).limit(5),
        supabase.rpc('search_tasks', { p_search_term: searchQuery, p_limit: 5 })
      ]);

      const projects = projectsRes.data || [];
      const users = (usersRes.data || []).map(p => ({
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email,
      }));
      const goals = goalsRes.data || [];
      const bills = billsRes.data || [];
      const tasks = tasksRes.data || [];

      setResults({ projects, users, goals, bills, tasks });
    } catch (error) {
      console.error("Error performing search:", error);
      setResults({ projects: [], users: [], goals: [], bills: [], tasks: [] });
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(debounce(performSearch, 300), []);

  useEffect(() => {
    if (conversation.length > 0) return;
    if (query) {
      setLoading(true);
      debouncedSearch(query);
    } else {
      setResults({ projects: [], users: [], goals: [], bills: [], tasks: [] });
      setLoading(false);
      debouncedSearch.cancel();
    }
  }, [query, debouncedSearch, conversation]);

  const handleSelect = (callback: () => void) => {
    setOpen(false);
    resetSearch();
    callback();
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
  
    const oldConversation = [...conversation];
    const newConversationForUi: ConversationMessage[] = [...conversation, { sender: 'user', content: message }];
    setConversation(newConversationForUi);
    setQuery("");
    setIsAiLoading(true);
    setResults({ projects: [], users: [], goals: [], bills: [], tasks: [] });
    setLoading(false);
  
    const pageContext = {
      pathname: location.pathname,
      search: location.search,
    };

    try {
      const result = await analyzeProjects(message, oldConversation, pageContext);
      
      const successKeywords = ['done!', 'updated', 'created', 'changed', 'i\'ve made'];
      if (successKeywords.some(keyword => result.toLowerCase().includes(keyword))) {
        toast.info("Action successful. Refreshing data...");
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['projects'] }),
            queryClient.invalidateQueries({ queryKey: ['project'] }),
            queryClient.invalidateQueries({ queryKey: ['kb_articles'] }),
            queryClient.invalidateQueries({ queryKey: ['kb_article'] }),
            queryClient.invalidateQueries({ queryKey: ['kb_folders'] }),
            queryClient.invalidateQueries({ queryKey: ['goals'] }),
            queryClient.invalidateQueries({ queryKey: ['goal'] }),
        ]);
      }
  
      setConversation(prev => [...prev, { sender: 'ai', content: result }]);
    } catch (error: any) {
      setConversation(prev => [...prev, { sender: 'ai', content: `Sorry, I encountered an error: ${error.message}` }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const hasResults = results.projects.length > 0 || results.users.length > 0 || results.goals.length > 0 || results.bills.length > 0 || results.tasks.length > 0;

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
      <CommandDialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetSearch(); }}>
        <CommandInput 
          placeholder="Search or ask AI..." 
          value={query}
          onValueChange={setQuery}
        />
        {conversation.length === 0 && (
          <div className="text-xs text-muted-foreground px-3 py-1.5 border-b flex items-center gap-2 truncate">
            <LinkIcon className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">Context: {location.pathname}</span>
          </div>
        )}
        <div ref={scrollRef} className="max-h-[400px] overflow-y-auto">
          {conversation.length > 0 && (
            <div className="p-4 space-y-4">
              {conversation.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                  {msg.sender === 'ai' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-sm rounded-lg px-3 py-2 ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} prose prose-sm dark:prose-invert max-w-none`}>
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground"><Sparkles className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="max-w-sm rounded-lg px-3 py-2 bg-muted flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <CommandList>
          {loading && <CommandEmpty>Searching...</CommandEmpty>}
          {!loading && !hasResults && query.length > 1 && conversation.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
          
          {query.length > 1 && (
            <CommandGroup heading={conversation.length > 0 ? "Send message" : "AI Assistant"}>
              <CommandItem
                onSelect={() => handleSendMessage(query)}
                value={`ai-${query}`}
                className="cursor-pointer"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                <span>{conversation.length > 0 ? `Send: "${query}"` : `Ask AI: "${query}"`}</span>
              </CommandItem>
            </CommandGroup>
          )}

          {conversation.length === 0 && (
            <>
              {results.tasks.length > 0 && (
                <CommandGroup heading="Tasks">
                  {results.tasks.map(task => (
                    <CommandItem
                      key={task.id}
                      onSelect={() => handleSelect(() => navigate(`/tasks/${task.id}`))}
                      value={`task-${task.id}-${task.title}`}
                      className="cursor-pointer"
                    >
                      <ListChecks className="mr-2 h-4 w-4" />
                      <span>{task.title}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{task.project_name}</span>
                    </CommandItem>
                  ))}
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
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}