import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Search, Briefcase, ListChecks, Users } from 'lucide-react';
import HighlightMatch from '@/components/HighlightMatch';
import { getInitials } from '@/lib/utils';

const useSearch = (query: string) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query) return { projects: [], tasks: [], people: [] };

      const [
        { data: projects, error: projectsError },
        { data: tasks, error: tasksError },
        { data: people, error: peopleError }
      ] = await Promise.all([
        supabase.rpc('search_projects', { p_search_term: query }),
        supabase.rpc('search_tasks', { p_search_term: query }),
        supabase.from('profiles').select('*').ilike('first_name', `%${query}%`),
      ]);

      if (projectsError) throw projectsError;
      if (tasksError) throw tasksError;
      if (peopleError) throw peopleError;

      const peopleData = people.map(profile => {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
        return {
          id: profile.id,
          name: fullName || profile.email || 'No name',
          avatar_url: profile.avatar_url,
          email: profile.email,
          initials: getInitials(fullName) || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role,
        };
      });

      return { projects, tasks, people: peopleData };
    },
    enabled: !!query,
  });
};

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);

  const { data, isLoading, error } = useSearch(query);

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: inputValue });
  };

  return (
    <div className="container mx-auto py-8">
      <form onSubmit={handleSearch} className="flex items-center gap-2 mb-8">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search for projects, tasks, people..."
          className="text-lg"
        />
      </form>

      {isLoading && <p>Searching...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Briefcase className="h-5 w-5" />
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.projects && data.projects.length > 0 ? (
              <ul className="space-y-2">
                {data.projects.map(p => (
                  <li key={p.id}>
                    <Link to={`/projects/${p.slug}`} className="hover:underline">
                      <HighlightMatch text={p.name} query={query} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No projects found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ListChecks className="h-5 w-5" />
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.tasks && data.tasks.length > 0 ? (
              <ul className="space-y-2">
                {data.tasks.map(t => (
                  <li key={t.id}>
                    <Link to={`/projects/${t.project_slug}`} className="hover:underline">
                      <HighlightMatch text={t.title} query={query} />
                      <span className="text-xs text-muted-foreground ml-2">in {t.project_name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No tasks found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>People</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.people && data.people.length > 0 ? (
              <ul className="space-y-3">
                {data.people.map(p => (
                  <li key={p.id}>
                    <Link to={`/profile/${p.id}`} className="flex items-center gap-3 hover:bg-muted/50 p-1 rounded-md">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={p.avatar_url} />
                        <AvatarFallback>{p.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium"><HighlightMatch text={p.name} query={query} /></p>
                        <p className="text-xs text-muted-foreground">{p.role}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No people found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SearchPage;