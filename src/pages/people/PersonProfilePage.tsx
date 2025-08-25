import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { usePerson } from '@/hooks/usePerson';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase, Cake, Edit, Globe, Instagram, Linkedin, Mail, MapPin, Phone, Twitter, User as UserIcon, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatInJakarta, generateVibrantGradient } from '@/lib/utils';
import PersonFormDialog from '@/components/people/PersonFormDialog';
import { Person } from '@/types';

const PersonProfileSkeleton = () => (
  <PortalLayout>
    <Skeleton className="h-8 w-32 mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  </PortalLayout>
);

const PersonProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: person, isLoading, error } = usePerson(id!);
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isLoading) return <PersonProfileSkeleton />;

  if (error || !person) {
    toast.error("Could not load person's profile.");
    navigate('/people');
    return null;
  }

  const firstEmail = person.contact?.emails?.[0];
  const firstPhone = person.contact?.phones?.[0];

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to People
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={person.avatar_url} />
                  <AvatarFallback style={generateVibrantGradient(person.id)} className="text-3xl">
                    <UserIcon className="h-10 w-10 text-white" />
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{person.full_name}</h2>
                <p className="text-muted-foreground">{person.job_title || 'No title'}</p>
                <Button className="mt-4 w-full" onClick={() => setIsFormOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {firstEmail && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${firstEmail}`} className="truncate hover:underline">{firstEmail}</a></div>}
                {firstPhone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><span className="truncate">{firstPhone}</span></div>}
                {person.address?.formatted_address && <div className="flex items-start gap-3"><MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" /><span>{person.address.formatted_address}</span></div>}
                {person.birthday && <div className="flex items-center gap-3"><Cake className="h-4 w-4 text-muted-foreground" /><span>{formatInJakarta(person.birthday, 'MMMM d, yyyy')}</span></div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {person.social_media?.linkedin && <div className="flex items-center gap-3"><Linkedin className="h-4 w-4 text-muted-foreground" /><a href={person.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">LinkedIn</a></div>}
                {person.social_media?.twitter && <div className="flex items-center gap-3"><Twitter className="h-4 w-4 text-muted-foreground" /><a href={person.social_media.twitter} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">Twitter</a></div>}
                {person.social_media?.instagram && <div className="flex items-center gap-3"><Instagram className="h-4 w-4 text-muted-foreground" /><a href={person.social_media.instagram} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">Instagram</a></div>}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Work Information</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-3"><Briefcase className="h-4 w-4 text-muted-foreground" /><span>{person.job_title || 'Not specified'} at {person.company || 'Not specified'}</span></div>
                <div className="flex items-center gap-3"><Users className="h-4 w-4 text-muted-foreground" /><span>Department: {person.department || 'Not specified'}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Related Projects</CardTitle></CardHeader>
              <CardContent>
                {person.projects && person.projects.length > 0 ? (
                  <div className="space-y-2">
                    {person.projects.map(project => (
                      <Link key={project.id} to={`/projects/${project.slug}`} className="block p-2 rounded-md hover:bg-muted">
                        <p className="font-medium">{project.name}</p>
                      </Link>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No projects linked yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {person.tags && person.tags.length > 0 ? (
                  person.tags.map(tag => (
                    <Badge key={tag.id} variant="outline" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>
                      {tag.name}
                    </Badge>
                  ))
                ) : <p className="text-sm text-muted-foreground">No tags assigned.</p>}
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
      <PersonFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        person={person}
      />
    </PortalLayout>
  );
};

export default PersonProfilePage;