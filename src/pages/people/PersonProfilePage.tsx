import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Person, Project } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatInJakarta, generatePastelColor, getInitials, getAvatarUrl, formatPhoneNumberForApi } from '@/lib/utils';
import PersonFormDialog from '@/components/people/PersonFormDialog';
import { useState } from 'react';
import {
  Mail, Phone, Building, Briefcase, Cake, StickyNote, Instagram, Twitter, Linkedin, Globe, MapPin, Edit, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const usePersonProfile = (personId: string) => {
  return useQuery({
    queryKey: ['personProfile', personId],
    queryFn: async (): Promise<Person | null> => {
      const { data, error } = await supabase
        .rpc('get_person_details_by_id', { p_id: personId });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const personData = data[0];
      const fullName = personData.full_name;

      return {
        ...personData,
        name: fullName,
        email: data.email,
        avatar_url: getAvatarUrl(data),
        initials: getInitials(fullName) || 'NN',
        role: data.role,
      };
    },
  });
};

const PersonProfilePage = () => {
  const { personId } = useParams<{ personId: string }>();
  const { data: person, isLoading, error } = usePersonProfile(personId!);
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isLoading) return <div>Loading...</div>;
  if (error || !person) return <div>Error loading profile.</div>;

  const email = person.contact?.emails?.[0] || person.email;
  const phone = (person.contact as any)?.phones?.[0] || person.phone;

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row items-start gap-8">
        <div className="w-full md:w-1/3">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={person.avatar_url} alt={person.full_name} />
                <AvatarFallback style={generatePastelColor(person.id)} className="text-4xl">
                  {getInitials(person.full_name)}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold text-center">{person.full_name}</h1>
              <p className="text-muted-foreground text-center">{person.job_title}</p>
              <p className="text-muted-foreground text-sm text-center">{person.company}</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => setIsFormOpen(true)}><Edit className="h-4 w-4 mr-2" /> Edit</Button>
                <Button variant="destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3 space-y-6">
          <Card>
            <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {email && <InfoItem icon={Mail} label="Email" value={email} href={`mailto:${email}`} />}
              {phone && <InfoItem icon={Phone} label="Phone" value={phone} href={`tel:${phone}`} />}
              {person.address && <InfoItem icon={MapPin} label="Address" value={`${person.address.street}, ${person.address.city}, ${person.address.state} ${person.address.zip}, ${person.address.country}`} />}
              <div className="flex gap-4">
                {person.social_media?.instagram && <SocialLink icon={Instagram} href={person.social_media.instagram} />}
                {person.social_media?.twitter && <SocialLink icon={Twitter} href={person.social_media.twitter} />}
                {person.social_media?.linkedin && <SocialLink icon={Linkedin} href={person.social_media.linkedin} />}
                {person.website && <SocialLink icon={Globe} href={person.website} />}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Work</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <InfoItem icon={Building} label="Company" value={person.company} />
              <InfoItem icon={Briefcase} label="Job Title" value={person.job_title} />
              <InfoItem icon={Briefcase} label="Department" value={person.department} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {person.birthday && <InfoItem icon={Cake} label="Birthday" value={format(new Date(person.birthday), 'MMMM d, yyyy')} />}
              {person.notes && <InfoItem icon={StickyNote} label="Notes" value={person.notes} />}
              {person.tags && person.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {person.tags.map(tag => (
                    <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color, color: '#fff' }}>{tag.name}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Associated Projects</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {person.projects?.map((project: Project) => (
                  <li key={project.id}>
                    <Link to={`/projects/${project.slug}`} className="text-primary hover:underline">{project.name}</Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      <PersonFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} person={person} />
    </div>
  );
};

const InfoItem = ({ icon: Icon, label, value, href }: { icon: React.ElementType, label: string, value: string | undefined | null, href?: string }) => {
  if (!value) return null;
  const content = (
    <div className="flex items-start gap-4">
      <Icon className="h-5 w-5 text-muted-foreground mt-1" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className="hover:bg-muted/50 p-2 rounded-md block">{content}</a> : <div className="p-2">{content}</div>;
};

const SocialLink = ({ icon: Icon, href }: { icon: React.ElementType, href: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    <Button variant="outline" size="icon">
      <Icon className="h-5 w-5" />
    </Button>
  </a>
);

export default PersonProfilePage;