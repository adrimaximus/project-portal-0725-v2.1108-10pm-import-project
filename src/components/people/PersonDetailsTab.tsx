import { Person, ContactProperty } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Cake, Linkedin, Mail, MapPin, Phone, Twitter, Users, Instagram } from 'lucide-react';
import { formatInJakarta } from '@/lib/utils';
import WhatsappIcon from '../icons/WhatsappIcon';

interface PersonDetailsTabProps {
  person: Person;
  customProperties: ContactProperty[];
}

const DetailRow = ({ icon, label, value, href }: { icon: React.ReactNode, label: string, value?: string | null, href?: string }) => {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[24px_1fr] items-start gap-4">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="font-medium text-sm">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground text-sm hover:underline break-all">{value}</a>
        ) : (
          <p className="text-muted-foreground text-sm break-all">{value}</p>
        )}
      </div>
    </div>
  );
};

const PersonDetailsTab = ({ person, customProperties }: PersonDetailsTabProps) => {
  const firstEmail = person.contact?.emails?.[0];
  const firstPhone = person.contact?.phones?.[0] || person.phone;

  const customPropertiesWithValue = customProperties.filter(prop => person.custom_properties && person.custom_properties[prop.name]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={firstEmail} href={`mailto:${firstEmail}`} />
          <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={firstPhone} />
          <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address" value={person.address?.formatted_address} />
          <DetailRow icon={<Cake className="h-4 w-4" />} label="Birthday" value={person.birthday ? formatInJakarta(person.birthday, 'MMMM d, yyyy') : undefined} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Work Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <DetailRow icon={<Briefcase className="h-4 w-4" />} label="Job Title" value={person.job_title} />
          <DetailRow icon={<Users className="h-4 w-4" />} label="Department" value={person.department} />
          <DetailRow icon={<Briefcase className="h-4 w-4" />} label="Company" value={person.company} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Social Media</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <DetailRow icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" value={person.social_media?.linkedin} href={person.social_media?.linkedin} />
          <DetailRow icon={<Twitter className="h-4 w-4" />} label="Twitter" value={person.social_media?.twitter} href={person.social_media?.twitter} />
          <DetailRow icon={<Instagram className="h-4 w-4" />} label="Instagram" value={person.social_media?.instagram} href={person.social_media?.instagram} />
        </CardContent>
      </Card>
      {customPropertiesWithValue.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {customPropertiesWithValue.map(prop => (
              <DetailRow key={prop.id} icon={<div className="h-4 w-4" />} label={prop.label} value={person.custom_properties?.[prop.name]} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonDetailsTab;