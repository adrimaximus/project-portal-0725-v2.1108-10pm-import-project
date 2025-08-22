import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Person } from '@/pages/PeoplePage';
import { Tag } from '@/types';
import PeopleKanbanCard from './PeopleKanbanCard';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const PeopleKanbanColumn = ({ tag, people, dragHappened, onEditPerson, isCollapsed, onToggleCollapse }: { 
  tag: Tag | { id: string, name: string, color: string }, 
  people: Person[], 
  dragHappened: React.MutableRefObject<boolean>, 
  onEditPerson: (person: Person) => void,
  isCollapsed: boolean,
  onToggleCollapse: (tagId: string) => void,
}) => {
  const { setNodeRef } = useDroppable({ id: tag.id });
  const personIds = useMemo(() => people.map(p => p.id), [people]);

  const handleToggle = () => {
    if (people.length === 0) {
      onToggleCollapse(tag.id);
    }
  };

  return (
    <div ref={setNodeRef} className={cn(
      "flex-shrink-0 transition-all duration-300",
      isCollapsed ? "w-16" : "w-72"
    )} onDoubleClick={handleToggle}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="font-semibold mb-4 px-1 text-base flex items-center justify-between flex-shrink-0">
          {!isCollapsed && (
            <div className="flex items-center truncate">
              <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: tag.color }}></span>
              <span className="truncate">{tag.name}</span>
            </div>
          )}
          {!isCollapsed && <Badge variant="secondary">{people.length}</Badge>}
        </div>

        {/* Content */}
        <div className="flex-grow min-h-0">
          {isCollapsed ? (
            <div className="flex items-center justify-center h-full cursor-pointer">
              <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap flex items-center gap-2">
                <span className="font-semibold">{tag.name}</span>
                <Badge variant="secondary">{people.length}</Badge>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default PeopleKanbanColumn;