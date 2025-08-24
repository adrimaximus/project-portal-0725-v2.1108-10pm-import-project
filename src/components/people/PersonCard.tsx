import { Person } from '@/pages/PeoplePage';
import { Card } from '@/components/ui/card';
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
    <Card className="group h-full flex transition-shadow hover:shadow-md cursor-pointer" onClick={() => onViewProfile(person)}>
      <div className="p-4 flex items-center justify-center">
        <Avatar className="h-24 w-24">
          <AvatarImage src={person.avatar_url} />
          <AvatarFallback style={generateVibrantGradient(person.id)}>
            <UserIcon className="h-10 w-10 text-white" />
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="p-4 flex flex-col flex-1 justify-between min-w-0">
        <div>
          <div className="flex justify-between items-start">
            <div className="min-w-0">
              <h3 className="font-bold text-lg truncate">{person.full_name}</h3>
              <p className="text-sm text-muted-foreground truncate">{person.job_title || 'No title'}</p>
            </div>
            {firstTag && (
              <Badge variant="outline" style={{ backgroundColor: `${firstTag.color}20`, borderColor: firstTag.color, color: firstTag.color }} className="flex-shrink-0 ml-2">
                {firstTag.name}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {person.notes || 'No additional notes.'}
          </p>
        </div>
        <div className="flex justify-end items-center mt-2 gap-2">
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
      </div>
    </Card>
  );
};

export default PersonCard;