import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Person } from '@/pages/PeoplePage';
import { Tag } from '@/types';
import PeopleKanbanCard from './PeopleKanbanCard';
import { Badge } from '../ui/badge';

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
        <div className="bg-muted/50 rounded-lg p-2 min-h-[400px] h-full w-full">
          <SortableContext id={tag.id} items={personIds} strategy={verticalListSortingStrategy}>
            {people.map(person => (
              <PeopleKanbanCard key={person.id} person={person} dragHappened={dragHappened} onEdit={onEditPerson} />
            ))}
          </SortableContext>
        </div>
      </div>
    </div>
  );
};

export default PeopleKanbanColumn;