import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Person, Tag } from '@/types';
import PeopleKanbanCard from './PeopleKanbanCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '../ui/button';
import { ChevronsLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PeopleKanbanColumnProps {
  tag: Tag | { id: string; name: string; color: string };
  people: Person[];
  dragHappened: React.MutableRefObject<boolean>;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (person: Person) => void;
  isCollapsed: boolean;
  onToggleCollapse: (columnId: string) => void;
}

const PeopleKanbanColumn = ({ tag, people, dragHappened, onEditPerson, onDeletePerson, isCollapsed, onToggleCollapse }: PeopleKanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: tag.id });
  const peopleIds = useMemo(() => people.map(p => p.id), [people]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-14" : "w-72"
      )}
    >
      <div className="flex flex-col bg-muted/50 rounded-lg">
        <div className="font-semibold p-3 text-base flex items-center justify-between flex-shrink-0">
          {!isCollapsed && (
            <h3 className="flex items-center gap-2 truncate">
              <span className="truncate">{tag.name}</span>
              <Badge variant="secondary">{people.length}</Badge>
            </h3>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleCollapse(tag.id)}>
            <ChevronsLeft className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {isCollapsed ? (
          <div className="flex-grow min-h-[6rem] flex items-center justify-center cursor-pointer p-3" onClick={() => onToggleCollapse(tag.id)}>
            <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap flex items-center gap-2 text-sm font-medium">
              <span className="truncate">{tag.name}</span>
              <Badge variant="secondary">{people.length}</Badge>
            </div>
          </div>
        ) : (
          <div className="min-h-[6rem] p-2 pt-0">
            <SortableContext id={tag.id} items={peopleIds} strategy={verticalListSortingStrategy}>
              {people.map(person => (
                <PeopleKanbanCard
                  key={person.id}
                  person={person}
                  dragHappened={dragHappened}
                  onEdit={onEditPerson}
                  onDelete={onDeletePerson}
                />
              ))}
            </SortableContext>
            {people.length === 0 && (
              <div className="flex items-center justify-center h-20 m-2 border-2 border-dashed border-border rounded-lg">
                <p className="text-sm text-muted-foreground">No people</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PeopleKanbanColumn;