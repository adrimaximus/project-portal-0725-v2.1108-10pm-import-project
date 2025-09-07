import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Person } from '@/types';
import PortalLayout from '@/components/PortalLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';
import { generatePastelColor } from '@/lib/utils';
import FullPageSpinner from '@/components/FullPageSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PersonDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: person, isLoading, error } = useQuery<Person>({
    queryKey: ['person', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_person_details_by_id', { p_id: id });
      if (error) throw error;
      // The RPC returns an array, so we take the first element.
      if (!data || data.length === 0) {
        throw new Error('Person not found');
      }
      return data[0];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <PortalLayout><div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></PortalLayout>;
  }

  if (error) {
    return <PortalLayout><div>Error loading person details: {(error as Error).message}</div></PortalLayout>;
  }

  if (!person) {
    return <PortalLayout><div>Person not found.</div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={person.avatar_url} />
            <AvatarFallback style={generatePastelColor(person.id)}>
              <UserIcon className="h-12 w-12 text-white" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{person.full_name}</h1>
            <p className="text-muted-foreground">{person.job_title}{person.company && ` at ${person.company}`}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Email:</strong> {person.email || person.contact?.emails?.[0] || '-'}</p>
                <p><strong>Phone:</strong> {person.phone || person.contact?.phones?.[0] || '-'}</p>
                <p><strong>Address:</strong> {person.address?.formatted_address || '-'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{person.notes || 'No notes available.'}</p>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {person.tags?.map(tag => (
                  <Badge key={tag.id} variant="outline" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>
                    {tag.name}
                  </Badge>
                ))}
                {(!person.tags || person.tags.length === 0) && <p className="text-sm text-muted-foreground">No tags</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Related Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {person.projects?.map(project => (
                  <div key={project.id}>{project.name}</div>
                ))}
                {(!person.projects || person.projects.length === 0) && <p className="text-sm text-muted-foreground">No projects</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default PersonDetailPage;