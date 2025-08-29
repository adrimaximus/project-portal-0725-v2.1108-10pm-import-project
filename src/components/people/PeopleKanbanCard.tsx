import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Person } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, generateVibrantGradient, formatInJakarta } from '@/lib/utils';
import { User as UserIcon, Mail, Phone, GitBranch, Cake, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

const PeopleKanbanCard = ({ person, dragHappened, onEdit, onDelete }: { person: Person, dragHappened: React.MutableRefObject<boolean>, onEdit: (person: Person) => void, onDelete: (person: Person) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: person.id });
  const navigate = useNavigate();
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : undefined,
  };

  const handleClick = () => {
    if (!dragHappened.current) {
      navigate(`/people/${person.id}`);
    }
  };

  const firstEmail = person.contact?.emails?.[0];
  const firstPhone = person.contact?.phones?.[0];
  const firstTag = person.tags?.[0];

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(isDragging && "opacity-30")}>
      <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
        <CardContent className="p-4 space-y-3">
          {/* Top Section */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10">
                <AvatarImage src={person.avatar_url} />
                <AvatarFallback style={generateVibrantGradient(person.id)}>
                  <UserIcon className="h-5 w-5 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm leading-snug truncate">{person.full_name}</h4>
                <p className="text-xs text-muted-foreground truncate">
                  {person.updated_at ? `Updated ${formatInJakarta(person.updated_at, 'MMM d, yyyy')}` : ''}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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

          {/* Separator */}
          <hr />

          {/* Bottom Section */}
          <div className="space-y-2 text-sm">
            {firstEmail && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{firstEmail}</span>
              </div>
            )}
            {firstPhone && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{firstPhone}</span>
              </div>
            )}
            {firstTag && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <GitBranch className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{firstTag.name}</span>
              </div>
            )}
            {person.birthday && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Cake className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{formatInJakarta(person.birthday, 'MMMM d')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PeopleKanbanCard;