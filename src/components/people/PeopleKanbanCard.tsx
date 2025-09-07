import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Person } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical, MoreVertical, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getInitials } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';

interface PeopleKanbanCardProps {
  person: Person;
  onEdit: (person?: Person) => void;
  onDelete?: (person?: Person) => void;
  dragHappened?: React.MutableRefObject<boolean>;
}

const PeopleKanbanCard = ({ person, onEdit, onDelete }: PeopleKanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: person.id,
    data: {
      type: 'Card',
      person,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return <div ref={setNodeRef} style={style} className="h-16 w-full bg-muted/80 rounded-lg border-2 border-dashed border-primary mb-2" />;
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(person);
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className="mb-2 touch-manipulation"
      onClick={() => onEdit(person)}
    >
      <CardContent className="p-2 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate cursor-pointer flex-1">
          <Avatar className="w-7 h-7 text-xs">
            <AvatarImage src={person.avatar_url} alt={person.full_name} />
            <AvatarFallback>{getInitials(person.full_name)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate">{person.full_name}</span>
        </div>
        <div className="flex items-center">
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground hover:bg-accent rounded-md">
            <GripVertical className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PeopleKanbanCard;