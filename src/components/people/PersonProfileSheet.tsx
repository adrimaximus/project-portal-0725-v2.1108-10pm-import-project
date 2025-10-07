import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Person, Project } from '@/types';
import { format } from 'date-fns';
import {
  Mail, Phone, Building, Briefcase, Cake, StickyNote, Instagram, Twitter, Linkedin, Globe, MapPin, Edit, Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { generatePastelColor, getInitials, getAvatarUrl } from '@/lib/utils';

interface PersonProfileSheetProps {
  person: Person | null;
  onOpenChange: (isOpen: boolean) => void;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
}

const InfoItem = ({ icon: Icon, label, value, href }: { icon: React.ElementType, label: string, value: string | undefined | null, href?: string }) => {
  if (!value) return null;
  const content = (
    <div className="flex items-start gap-4">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium break-words">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className="hover:bg-muted/50 p-2 rounded-md block -m-2">{content}</a> : <div className="p-2">{content}</div>;
};

const SocialLink = ({ icon: Icon, href }: { icon: React.ElementType, href: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    <Button variant="outline" size="icon">
      <Icon className="h-5 w-5" />
    </Button>
  </a>
);

const PersonProfileSheet = ({ person, onOpenChange, onEdit, onDelete }: PersonProfileSheetProps) => {
  if (!person) return null;

  const email = person.contact?.emails?.[0] || person.email;
  const phone = (person.contact as any)?.phones?.[0] || person.phone;

  return (
    <Sheet open={!!person} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle>Person Profile</SheetTitle>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto pr-6 pl-1 -mr-6 -ml-1">
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={person.avatar_url || undefined} alt={person.full_name} />
                <AvatarFallback style={generatePastelColor(person.id)} className="text-3xl">
                  {getInitials(person.full_name)}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold">{person.full_name}</h1>
              <p className="text-muted-foreground">{person.job_title}</p>
              <p className="text-muted-foreground text-sm">{person.company}</p>
            </div>

            <Card>
              <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {email && <InfoItem icon={Mail} label="Email" value={email} href={`mailto:${email}`} />}
                {phone && <InfoItem icon={Phone} label="Phone" value={phone} href={`tel:${phone}`} />}
                {person.address?.formatted_address && <InfoItem icon={MapPin} label="Address" value={person.address.formatted_address} />}
                <div className="flex gap-4">
                  {person.social_media?.instagram && <SocialLink icon={Instagram} href={person.social_media.instagram} />}
                  {person.social_media?.twitter && <SocialLink icon={Twitter} href={person.social_media.twitter} />}
                  {person.social_media?.linkedin && <SocialLink icon={Linkedin} href={person.social_media.linkedin} />}
                  {(person as any).website && <SocialLink icon={Globe} href={(person as any).website} />}
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
        <SheetFooter className="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => onEdit(person)}><Edit className="h-4 w-4 mr-2" /> Edit</Button>
          <Button variant="destructive" onClick={() => onDelete(person)}><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default PersonProfileSheet;