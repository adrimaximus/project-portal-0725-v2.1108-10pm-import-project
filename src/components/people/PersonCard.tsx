import { Person } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, User, Mail, Phone, Building } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface PersonCardProps {
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onViewProfile: (person: Person) => void;
}

const PersonCard = ({ person, onEdit, onDelete, onViewProfile }: PersonCardProps) => {
  const getInitials = (name: string) => {
    if (!name) return '??';
    const names = name.split(' ').filter(Boolean);
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0]?.substring(0, 2).toUpperCase() || '??';
  };

  const email = Array.isArray(person.contact?.emails) && person.contact.emails.length > 0 ? person.contact.emails[0] : person.email;
  const phone = Array.isArray(person.contact?.phones) && person.contact.phones.length > 0 ? person.contact.phones[0] : person.phone;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <Avatar className="h-16 w-16 cursor-pointer" onClick={() => onViewProfile(person)}>
            <AvatarImage src={getAvatarUrl(person.avatar_url, person.id)} alt={person.full_name} />
            <AvatarFallback>{getInitials(person.full_name)}</AvatarFallback>
          </Avatar>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onViewProfile(person)}>
                <User className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onEdit(person)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onDelete(person)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="pt-2">
          <h3 className="text-lg font-semibold cursor-pointer hover:underline" onClick={() => onViewProfile(person)}>
            {person.full_name}
          </h3>
          <p className="text-sm text-muted-foreground">{person.job_title}</p>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm">
        {person.company && (
          <div className="flex items-center text-muted-foreground">
            <Building className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{person.company}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center text-muted-foreground">
            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
            <a href={`mailto:${email}`} className="truncate hover:underline">{email}</a>
          </div>
        )}
        {phone && (
          <div className="flex items-center text-muted-foreground">
            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{phone}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex flex-wrap gap-1">
          {person.tags?.slice(0, 2).map(tag => (
            <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color, color: '#fff' }}>
              {tag.name}
            </Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default PersonCard;