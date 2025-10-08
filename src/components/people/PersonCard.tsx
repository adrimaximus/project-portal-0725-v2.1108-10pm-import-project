import { Person } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, Instagram, Briefcase, Mail } from 'lucide-react';
import { generatePastelColor } from '@/lib/utils';
import WhatsappIcon from '../icons/WhatsappIcon';
import { Link } from 'react-router-dom';

interface PersonCardProps {
  person: Person;
}

export default function PersonCard({ person }: PersonCardProps) {
  const primaryEmail = person.contact?.emails?.[0];
  const primaryPhone = person.contact?.phones?.[0];

  return (
    <Link to={`/people/${person.id}`}>
      <Card className="overflow-hidden h-full flex flex-col group">
        <div className="relative h-32 bg-muted">
          {person.avatar_url ? (
            <img src={person.avatar_url} alt={person.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: generatePastelColor(person.id) }}>
              <UserIcon className="h-16 w-16 text-white/50" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <h3 className="font-bold text-lg text-white truncate">{person.full_name}</h3>
            <p className="text-sm text-gray-300 truncate">{person.job_title}</p>
          </div>
        </div>
        <CardContent className="p-4 flex-grow flex flex-col justify-between">
          <div>
            {person.company && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Briefcase className="h-4 w-4" />
                <span className="truncate">{person.company}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {person.tags?.slice(0, 3).map(tag => (
                <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                  {tag.name}
                </Badge>
              ))}
              {person.tags && person.tags.length > 3 && (
                <Badge variant="outline">+{person.tags.length - 3}</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            {primaryEmail && (
              <a href={`mailto:${primaryEmail}`} onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-primary">
                <Mail className="h-5 w-5" />
              </a>
            )}
            {primaryPhone && (
              <a href={`https://wa.me/${primaryPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-primary">
                <WhatsappIcon className="h-5 w-5" />
              </a>
            )}
            {person.social_media?.instagram && (
              <a href={`https://instagram.com/${person.social_media.instagram}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}