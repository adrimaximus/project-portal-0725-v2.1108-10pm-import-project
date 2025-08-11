import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dummyProjects, Project } from '@/data/projects';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<{ projects: Project[], users: User[] }>({ projects: [], users: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (!query) {
        setResults({ projects: [], users: [] });
        return;
      }
      setLoading(true);
      
      // This is a simplified search. A real implementation would use full-text search.
      const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);

      // Project search is using dummy data for now.
      const projectResults = dummyProjects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

      if (userError) {
        toast.error("Failed to search for users.");
      }

      setResults({ projects: projectResults, users: (users as User[]) || [] });
      setLoading(false);
    };

    performSearch();
  }, [query]);

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Search Results</h1>
          <p className="text-muted-foreground">Showing results for "{query}"</p>
        </div>

        <Input 
          type="search" 
          placeholder="Search for projects, users, files..." 
          className="w-full"
          value={query}
          onChange={(e) => setSearchParams({ q: e.target.value })}
        />

        {loading ? (
          <p>Searching...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {results.projects.length > 0 ? (
                  <ul className="space-y-2">
                    {results.projects.map(p => <li key={p.id}>{p.name}</li>)}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No projects found.</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>
                {results.users.length > 0 ? (
                  <ul className="space-y-2">
                    {results.users.map(u => <li key={u.id}>{u.name || u.email}</li>)}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No users found.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default SearchPage;