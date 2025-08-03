import { useState } from 'react';
import PortalLayout from '@/components/PortalLayout';
import { Input } from '@/components/ui/input';
import { allProjects } from '@/data/projects';
import { dummyUsers } from '@/data/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const lowerCaseSearch = searchTerm.toLowerCase();
  const filteredProjects = searchTerm ? allProjects.filter(p => p.name.toLowerCase().includes(lowerCaseSearch)) : [];
  const filteredUsers = searchTerm ? dummyUsers.filter(u => u.name.toLowerCase().includes(lowerCaseSearch)) : [];

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Search</h1>
          <p className="text-muted-foreground">Find projects, users, and more across your workspace.</p>
        </div>
        <Input 
          placeholder="Start typing to search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {searchTerm && (
          <div className="grid gap-6">
            <Card>
              <CardHeader><CardTitle>Projects ({filteredProjects.length})</CardTitle></CardHeader>
              <CardContent>
                {filteredProjects.length > 0 ? (
                  <ul className="space-y-2">
                    {filteredProjects.map(p => <li key={p.id}><Link to={`/projects/${p.id}`} className="text-primary hover:underline">{p.name}</Link></li>)}
                  </ul>
                ) : <p className="text-muted-foreground">No projects found matching your search.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Users ({filteredUsers.length})</CardTitle></CardHeader>
              <CardContent>
                {filteredUsers.length > 0 ? (
                  <ul className="space-y-3">
                    {filteredUsers.map(u => (
                      <li key={u.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar} />
                          <AvatarFallback>{u.initials}</AvatarFallback>
                        </Avatar>
                        <span>{u.name}</span>
                        <span className="text-muted-foreground text-sm">{u.email}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-muted-foreground">No users found matching your search.</p>}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};

export default SearchPage;