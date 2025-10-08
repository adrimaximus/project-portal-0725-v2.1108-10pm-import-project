import { Person } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, User as UserIcon, Briefcase, MapPin, Mail, Instagram, Twitter, Linkedin } from 'lucide-react';
import { generatePastelColor, getAvatarUrl, formatPhoneNumberForApi } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Link } from 'react-router-dom';
import WhatsappIcon from '../icons/WhatsappIcon';

interface PersonListCardProps {
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (personId: string) => void;
}

export default function PersonListCard({ person, onEdit, onDelete }: PersonListCardProps) {
  const primaryEmail = person.contact?.emails?.[0];
  const primaryPhone = person.contact?.phones?.[0];

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <Link to={`/people/${person.id}`}>
          <Avatar className="h-10 w-10">
            <AvatarImage src={person.avatar_url} />
            <AvatarFallback style={{ backgroundColor: generatePastelColor(person.id) }}>
              <UserIcon className="h-5 w-5 text-white" />
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/people/${person.id}`} className="font-semibold truncate hover:underline">{person.full_name}</Link>
          <p className="text-sm text-muted-foreground truncate">{person.job_title}</p>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-2 w-1/4">
        <Briefcase className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm truncate">{person.company}</span>
      </div>
      <div className="hidden lg:flex items-center gap-2 w-1/4">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm truncate">{[person.address?.city, person.address?.country].filter(Boolean).join(', ')}</span>
      </div>
      <div className="flex items-center gap-2">
        {primaryEmail && <a href={`mailto:${primaryEmail}`} className="text-muted-foreground hover:text-primary"><Mail className="h-4 w-4" /></a>}
        {primaryPhone && <a href={`https://wa.me/${formatPhoneNumberForApi(primaryPhone)}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><WhatsappIcon className="h-4 w-4" /></a>}
        {person.social_media?.instagram && <a href={`https://instagram.com/${person.social_media.instagram}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Instagram className="h-4 w-4" /></a>}
        {person.social_media?.twitter && <a href={`https://twitter.com/${person.social_media.twitter}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Twitter className="h-4 w-4" /></a>}
        {person.social_media?.linkedin && <a href={person.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Linkedin className="h-4 w-4" /></a>}
      </div>
      <div className="ml-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onEdit(person)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(person.id)} className="text-red-500">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}