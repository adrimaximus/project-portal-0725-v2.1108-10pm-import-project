import { Person } from '@/pages/PeoplePage';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, User as UserIcon, Edit, Trash2, MapPin, Mail, Cake, Phone, Linkedin, Twitter, Instagram } from 'lucide-react';
import { generateVibrantGradient, formatInJakarta } from '@/lib/utils';

interface PersonCardProps {
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
}

const PersonCard = ({ person, onEdit, onDelete }: PersonCardProps) => {
  const firstEmail = person.contact?.emails?.[0];
  const firstPhone = person.contact?.phones?.[0];

  return (
    <Card className="overflow-hidden relative group h-full flex flex-col">
      {/* Banner */}
      <div className="h-24 bg-muted" style={generateVibrantGradient(person.id)}></div>
      
      {/* Edit Button */}
      <Button 
        size="icon" 
        variant="secondary" 
        className="absolute top-3 right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); onEdit(person); }}
      >
        <Edit className="h-4 w-4" />
        <span className="sr-only">Edit Person</span>
      </Button>

      {/* Content */}
      <div className="pt-16 text-center relative flex-grow flex flex-col">
        {/* Avatar */}
        <Avatar className="h-24 w-24 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-background bg-background">
          <AvatarImage src={person.avatar_url} />
          <AvatarFallback style={generateVibrantGradient(person.id)}>
            <UserIcon className="h-10 w-10 text-white" />
          </AvatarFallback>
        </Avatar>

        <div className="px-4 pb-4 flex-grow">
          <h3 className="font-bold text-xl">{person.full_name}</h3>
          <p className="text-sm text-muted-foreground">{person.job_title || 'No title'}</p>
          
          {person.address?.formatted_address && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{person.address.formatted_address}</span>
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-4 text-left line-clamp-3">
            {person.notes || 'No additional notes.'}
          </p>

          <div className="space-y-2 text-left mt-6">
            {firstEmail && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href={`mailto:${firstEmail}`} className="truncate hover:underline text-primary">{firstEmail}</a>
              </div>
            )}
            {person.birthday && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Cake className="h-4 w-4 flex-shrink-0" />
                <span>{formatInJakarta(person.birthday, 'd MMMM yyyy')}</span>
              </div>
            )}
            {firstPhone && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{firstPhone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>Joined on {formatInJakarta(person.created_at, 'd MMM yyyy')}</span>
        <div className="flex items-center gap-1">
          {person.social_media?.linkedin && (
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <a href={person.social_media.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin className="h-4 w-4" /></a>
            </Button>
          )}
          {person.social_media?.twitter && (
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <a href={person.social_media.twitter} target="_blank" rel="noopener noreferrer"><Twitter className="h-4 w-4" /></a>
            </Button>
          )}
          {person.social_media?.instagram && (
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <a href={person.social_media.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="h-4 w-4" /></a>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(person)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDelete(person)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};

export default PersonCard;