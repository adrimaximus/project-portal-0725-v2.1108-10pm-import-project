import { Person } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, User as UserIcon, Edit, Trash2 } from 'lucide-react';
import { generateVibrantGradient } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface PersonCardProps {
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
  onViewProfile: (person: Person) => void;
}

const PersonCard = ({ person, onEdit, onDelete, onViewProfile }: PersonCardProps) => {
  const firstTag = person.tags?.[0];

  return (
    <Card 
      className="group h-full flex flex-col text-center transition-shadow hover:shadow-lg cursor-pointer rounded-2xl bg-muted/50" 
      onClick={() => onViewProfile(person)}
    >
      <CardContent className="p-6 flex flex-col items-center justify-center flex-grow">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={person.avatar_url} />
          <AvatarFallback style={generateVibrantGradient(person.id)}>
            <UserIcon className="h-10 w-10 text-white" />
          </AvatarFallback>
        </Avatar>
        <h3 className="font-bold text-lg truncate w-full">{person.full_name}</h3>
        <p className="text-sm text-muted-foreground truncate w-full">{person.job_title || 'No title'}</p>
        {firstTag && (
          <Badge 
            variant="outline" 
            style={{ backgroundColor: `${firstTag.color}20`, borderColor: firstTag.color, color: firstTag.color }} 
            className="mt-2"
          >
            {firstTag.name}
          </Badge>
        )}
      </CardContent>
      <div className="p-2 border-t border-muted/50 flex justify-end items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); onEdit(person); }}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.stopPropagation(); onDelete(person); }} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};

export default PersonCard;