import { useSearchParams, Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { dummyProjects } from '@/data/projects';
import { Project, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Building, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import HighlightMatch from '@/components/HighlightMatch';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const term = searchParams.get('q') || '';
    setSearchTerm(term);

    const performSearch = async () => {
      if (!term) {
        setProjects([]);
        setUsers([]);
        return;
      }

      // Search projects (using dummy data for now)
      setProjects(dummyProjects.filter(p => p.name.toLowerCase().includes(term.toLowerCase())));

      // Search users from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`);
      
      if (data) {
        const foundUsers = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'No name',
          avatar: profile.avatar_url,
          email: profile.email,
          initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
        }));
        setUsers(foundUsers);
      }
    };

    performSearch();
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <form onSubmit={handleSearch}>
          <Input
            type="search"
            placeholder="Search anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-lg p-6"
            autoFocus
          />
        </form>

        {searchTerm && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Results for "<span className="text-primary">{searchTerm}</span>"
            </h2>

            <div className="space-y-6">
              {projects.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Projects ({projects.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 divide-y">
                    {projects.map(project => (
                      <Link to={`/projects/${project.slug}`} key={project.id} className="block p-3 rounded-md hover:bg-muted -mx-3">
                        <p className="font-medium">
                          <HighlightMatch text={project.name} query={searchTerm} />
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {users.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      Users ({users.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 divide-y">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-3 -mx-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            <HighlightMatch text={user.name} query={searchTerm} />
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {projects.length === 0 && users.length === 0 && (
                <p className="text-muted-foreground text-center py-10">No results found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default SearchPage;