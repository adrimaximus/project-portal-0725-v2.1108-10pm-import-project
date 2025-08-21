import { Person } from '@/pages/PeoplePage';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, User as UserIcon, Copy, Edit, Trash2 } from 'lucide-react';
import { generateVibrantGradient } from '@/lib/utils';
import { toast } from 'sonner';

interface PersonCardProps {
  person: Person;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
}

const PersonCard = ({ person, onEdit, onDelete }: PersonCardProps) => {
  const firstEmail = person.contact?.emails?.[0];

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (firstEmail) {
      navigator.clipboard.writeText(firstEmail);
      toast.success("Email copied to clipboard!");
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center gap-4 space-y-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={person.avatar_url} />
          <AvatarFallback style={generateVibrantGradient(person.id)}>
            <UserIcon className="h-6 w-6 text-white" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{person.full_name}</h3>
          <p className="text-sm text-muted-foreground truncate">{person.job_title || 'No title'}</p>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {firstEmail && (
          <div className="flex items-center justify-between p-2 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground truncate">{firstEmail}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={handleCopyEmail}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => onEdit(person)}>View Details</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
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
      </CardFooter>
    </Card>
  );
};

export default PersonCard;