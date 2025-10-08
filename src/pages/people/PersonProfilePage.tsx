import { useParams } from 'react-router-dom';
import { usePerson } from '@/hooks/usePerson';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Briefcase, Edit, Mail, MapPin, Phone, User as UserIcon, Calendar, FileText,
  Instagram, Twitter, Linkedin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatInJakarta, generatePastelColor, getInitials, getAvatarUrl, formatPhoneNumberForApi } from '@/lib/utils';
import PersonFormDialog from '@/components/people/PersonFormDialog';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import WhatsappIcon from '@/components/icons/WhatsappIcon';

export default function PersonProfilePage() {
  const { personId } = useParams<{ personId: string }>();
  const { data: person, isLoading, error } = usePerson(personId!);
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!person) return <div>Person not found.</div>;

  const {
    full_name,
    job_title,
    company,
    contact,
    address,
    social_media,
    birthday,
    notes,
    projects,
    tags,
  } = person;

  const primaryEmail = contact?.emails?.[0];
  const primaryPhone = contact?.phones?.[0];

  const personForForm = {
    ...person,
    avatar_url: getAvatarUrl(person.avatar_url),
    initials: getInitials(full_name, primaryEmail) || 'NN',
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 lg:w-1/4 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={person.avatar_url} alt={person.full_name} />
                <AvatarFallback style={{ backgroundColor: generatePastelColor(person.id) }} className="text-3xl">
                  <UserIcon className="h-10 w-10 text-white" />
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold text-center">{full_name}</h1>
              <p className="text-muted-foreground text-center">{job_title}</p>
              <p className="text-muted-foreground text-sm text-center">{company}</p>
              <Button className="mt-4 w-full" onClick={() => setIsFormOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {primaryEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                  <a href={`mailto:${primaryEmail}`} className="hover:underline break-all">{primaryEmail}</a>
                </div>
              )}
              {primaryPhone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                  <span>{primaryPhone}</span>
                </div>
              )}
              {address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                  <span>
                    {address.street && <div>{address.street}</div>}
                    {[address.city, address.state, address.zip].filter(Boolean).join(', ')}
                    {address.country && <div>{address.country}</div>}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social & Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {primaryPhone && (
                <a href={`https://wa.me/${formatPhoneNumberForApi(primaryPhone)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-primary">
                  <WhatsappIcon className="h-4 w-4 text-muted-foreground" />
                  <span>WhatsApp</span>
                </a>
              )}
              {social_media?.linkedin && (
                <a href={social_media.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-primary">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <span>LinkedIn</span>
                </a>
              )}
              {social_media?.twitter && (
                <a href={`https://twitter.com/${social_media.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-primary">
                  <Twitter className="h-4 w-4 text-muted-foreground" />
                  <span>Twitter</span>
                </a>
              )}
              {social_media?.instagram && (
                <a href={`https://instagram.com/${social_media.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-primary">
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                  <span>Instagram</span>
                </a>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {birthday && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Birthday</p>
                    <p>{formatInJakarta(new Date(birthday), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p>{person.department || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {tags?.map(tag => (
                <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                  {tag.name}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Associated Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {projects?.map(project => (
                <Link key={project.id} to={`/projects/${project.slug}`} className="block p-2 rounded-md hover:bg-muted">
                  {project.name}
                </Link>
              ))}
            </CardContent>
          </Card>

          {notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>{notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <PersonFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        person={personForForm}
      />
    </div>
  );
}