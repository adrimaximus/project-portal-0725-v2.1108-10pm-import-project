import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Briefcase, Users, MapPin, Cake, Linkedin, Twitter, Instagram } from 'lucide-react';
import { formatInJakarta, generatePastelColor, getInitials, getAvatarUrl, formatPhoneNumberForWhatsApp } from '@/lib/utils';
import { PersonFormDialog } from '@/components/people/PersonFormDialog';
import { Person, ContactProperty } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { WhatsappIcon } from '@/components/WhatsappIcon';

const PersonProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: person, isLoading, error } = useQuery<Person | null>({
    queryKey: ['person', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.rpc('get_person_details_by_id', { p_id: id });
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) return null;
      const personData = data[0] as Person;
      personData.avatar_url = getAvatarUrl(personData.avatar_url, personData.id);
      return personData;
    },
    enabled: !!id,
  });

  const { data: customProperties = [] } = useQuery<ContactProperty[]>({
    queryKey: ['contactProperties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contact_properties').select('*');
      if (error) throw new Error(error.message);
      return data;
    }
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-full text-red-500">Error: {error.message}</div>;
  }

  if (!person) {
    return <div className="flex justify-center items-center h-full">Person not found.</div>;
  }

  const firstEmail = person.contact?.emails?.[0];
  const firstPhone = person.contact?.phones?.[0] || person.phone;
  const whatsappLink = firstPhone ? `https://wa.me/${formatPhoneNumberForWhatsApp(firstPhone)}` : null;

  const customPropertiesWithValue = customProperties.filter(prop => person.custom_properties && person.custom_properties[prop.name]);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar */}
        <div className="w-full lg:w-1/3 xl:w-1/4 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={person.avatar_url || undefined} alt={person.full_name} />
                <AvatarFallback style={generatePastelColor(person.id)} className="text-3xl">
                  {getInitials(person.full_name)}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold text-center">{person.full_name}</h1>
              <p className="text-muted-foreground text-center">{person.job_title || 'No title'}</p>
              <div className="mt-4">
                <PersonFormDialog person={person} onSuccess={() => queryClient.invalidateQueries({ queryKey: ['person', id] })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {firstEmail && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${firstEmail}`} className="truncate hover:underline text-primary">{firstEmail}</a></div>}
              {whatsappLink && <div className="flex items-center gap-3"><WhatsappIcon className="h-4 w-4 text-muted-foreground" /><a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-primary">{firstPhone}</a></div>}
              {person.address?.formatted_address && <div className="flex items-start gap-3"><MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" /><span>{person.address.formatted_address}</span></div>}
              {person.birthday && <div className="flex items-center gap-3"><Cake className="h-4 w-4 text-muted-foreground" /><span>{formatInJakarta(new Date(person.birthday), 'MMMM d, yyyy')}</span></div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Social</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {person.social_media?.linkedin && <div className="flex items-center gap-3"><Linkedin className="h-4 w-4 text-muted-foreground" /><a href={person.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">LinkedIn</a></div>}
              {person.social_media?.twitter && <div className="flex items-center gap-3"><Twitter className="h-4 w-4 text-muted-foreground" /><a href={person.social_media.twitter} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">Twitter</a></div>}
              {person.social_media?.instagram && <div className="flex items-center gap-3"><Instagram className="h-4 w-4 text-muted-foreground" /><a href={person.social_media.instagram} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">Instagram</a></div>}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-2/3 xl:w-3/4 space-y-6">
          <Card>
            <CardHeader><CardTitle>Work</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3"><Briefcase className="h-4 w-4 text-muted-foreground" /><span>{person.job_title || 'Not specified'} at {person.company || 'Not specified'}</span></div>
              <div className="flex items-center gap-3"><Users className="h-4 w-4 text-muted-foreground" /><span>Department: {person.department || 'Not specified'}</span></div>
            </CardContent>
          </Card>

          {customPropertiesWithValue.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Additional Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {customPropertiesWithValue.map(prop => (
                  <div key={prop.id} className="flex">
                    <span className="font-semibold w-24 flex-shrink-0">{prop.label}:</span>
                    <span className="text-muted-foreground">{person.custom_properties?.[prop.name]}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Associated Projects</CardTitle></CardHeader>
            <CardContent>
              {person.projects && person.projects.length > 0 ? (
                <div className="space-y-2">
                  {person.projects.map(project => (
                    <Link key={project.id} to={`/projects/${project.slug}`} className="block p-2 rounded-md hover:bg-muted">
                      <p className="font-semibold">{project.name}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No associated projects.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {person.tags && person.tags.length > 0 ? (
                person.tags.map(tag => (
                  <Badge key={tag.id} variant="secondary" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>{tag.name}</Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tags.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{person.notes || 'No notes for this contact.'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PersonProfilePage;