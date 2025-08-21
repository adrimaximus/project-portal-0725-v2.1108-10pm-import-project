import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Person } from '@/pages/PeoplePage';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, generateVibrantGradient } from '@/lib/utils';
import { User as UserIcon } from 'lucide-react';

const PeopleKanbanCard = ({ person, dragHappened, onEdit }: { person: Person, dragHappened: React.MutableRefObject<boolean>, onEdit: (person: Person) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: person.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : undefined,
  };

  const handleClick = () => {
    if (!dragHappened.current) {
      onEdit(person);
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn(isDragging && "opacity-30")}>
      <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer" onClick={handleClick}>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={person.avatar_url} />
              <AvatarFallback style={generateVibrantGradient(person.id)}>
                <UserIcon className="h-5 w-5 text-white" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm leading-snug truncate">{person.full_name}</h4>
              <p className="text-xs text-muted-foreground truncate">{person.job_title || 'No title'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PeopleKanbanCard;