import React, { memo } from 'react';
import { Person } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, User as UserIcon, Briefcase, MapPin, Mail, Instagram, Twitter, Linkedin } from 'lucide-react';
import { generatePastelColor, getAvatarUrl, formatPhoneNumberForApi } from '@/lib/utils';
import { Badge } from '../ui/badge';
import WhatsappIcon from '../icons/WhatsappIcon';
import { toast } from 'sonner';

interface PersonListCardProps {
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onViewProfile: (person: Person) => void;
}

const PersonListCard: React.FC<PersonListCardProps> = ({ person, onEdit, onDelete, onViewProfile }) => {
  const emailToDisplay = person.contact?.emails?.[0] || person.email;
  const phoneToDisplay = (person.contact as any)?.phones?.[0] || person.phone;
  const displayAddress = (typeof person.address === 'object' && person.address?.formatted_address) || (typeof person.address === 'string' && person.address) || null;

  const handleCopyEmail = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    if (email) {
      navigator.clipboard.writeText(email);
      toast.success('Email address copied!');
    }
  };

  return (
    <Card onClick={() => onViewProfile(person)} className="cursor-pointer">
      <CardHeader className="flex flex-row items-start justify-between p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getAvatarUrl(person.avatar_url, person.id)} loading="lazy" />
            <AvatarFallback style={generatePastelColor(person.id)}>
              <UserIcon className="h-5 w-5 text-white" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{person.full_name}</p>
            <p className="text-sm text-muted-foreground">{emailToDisplay}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); onEdit(person); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); onDelete(person); }} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {(person.job_title || person.company) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="h-4 w-4 flex-shrink-0" />
            <span>{person.job_title}{person.job_title && person.company ? ' at ' : ''}{person.company}</span>
          </div>
        )}
        {displayAddress && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{displayAddress}</span>
          </div>
        )}
        <div className="flex items-center gap-4 pt-2 border-t">
          {phoneToDisplay && (
            <a href={`https://wa.me/${formatPhoneNumberForApi(phoneToDisplay)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
              <WhatsappIcon className="h-5 w-5" />
            </a>
          )}
          {emailToDisplay && (
            <button onClick={(e) => handleCopyEmail(e, emailToDisplay)} className="text-muted-foreground hover:text-primary transition-colors">
              <Mail className="h-5 w-5" />
            </button>
          )}
          {person.social_media?.instagram && (
            <a href={person.social_media.instagram} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
          )}
          {person.social_media?.twitter && (
            <a href={person.social_media.twitter} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
          )}
          {person.social_media?.linkedin && (
            <a href={person.social_media.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors">
              <Linkedin className="h-5 w-5" />
            </a>
          )}
        </div>
        {(person.tags && person.tags.length > 0) && (
          <div className="flex flex-wrap gap-1 pt-2 border-t">
            {person.tags.map(tag => (
              <Badge key={tag.id} variant="outline" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(PersonListCard);