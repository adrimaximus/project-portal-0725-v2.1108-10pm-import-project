import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Person } from '@/pages/PeoplePage';
import { Tag } from '@/types';
import PeopleKanbanCard from './PeopleKanbanCard';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const PeopleKanbanColumn = ({ tag, people, dragHappened, onEditPerson }: { tag: Tag | { id: string, name: string, color: string }, people: Person[], dragHappened: React.MutableRefObject<boolean>, onEditPerson: (person: Person) => void }) => {
  const { setNodeRef } = useDroppable({ id: tag.id });
  const personIds = useMemo(() => people.map(p => p.id), [people]);

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-72">
      <div className="h-full flex flex-col">
        <h3 className="font-semibold mb-4 px-1 text-base flex items-center">
          <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tag.color }}></span>
          {tag.name}
          <Badge variant="secondary" className="ml-2">{people.length}</Badge>
        </h3>
        <div className={cn(
          "bg-muted/50 rounded-lg p-2 h-full w-full",
          people.length > 0 && "min-h-[400px]"
        )}>
          <SortableContext id={tag.id} items={personIds} strategy={verticalListSortingStrategy}>
            {people.map(person => (
              <PeopleKanbanCard key={person.id} person={person} dragHappened={dragHappened} onEdit={onEditPerson} />
            ))}
          </SortableContext>
          {people.length === 0 && (
             <div className="flex items-center justify-center h-20 border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Drop here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeopleKanbanColumn;