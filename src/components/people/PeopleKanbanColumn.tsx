import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Person } from '@/types';
import { Tag } from '@/types';
import PeopleKanbanCard from './PeopleKanbanCard';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ChevronsLeft } from 'lucide-react';

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

  return (
    <div ref={setNodeRef} className={cn(
      "flex-shrink-0 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-14" : "w-72"
    )}>
      <div className="h-full flex flex-col bg-muted/50 rounded-lg">
        {/* Header */}
        <div className="font-semibold p-3 text-base flex items-center justify-between flex-shrink-0">
          {!isCollapsed && (
            <div className="flex items-center truncate">
              <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: tag.color }}></span>
              <span className="truncate">{tag.name}</span>
              <Badge variant="secondary" className="ml-2">{people.length}</Badge>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleCollapse(tag.id)}>
            <ChevronsLeft className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Content */}
        {isCollapsed ? (
          <div className="flex-grow min-h-0 flex items-center justify-center cursor-pointer" onClick={() => onToggleCollapse(tag.id)}>
            <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap flex items-center gap-2 text-sm font-medium">
              <span className="truncate">{tag.name}</span>
              <Badge variant="secondary">{people.length}</Badge>
            </div>
          </div>
        ) : (
          <div className="flex-grow min-h-0 overflow-y-auto p-2 pt-0">
            <SortableContext id={tag.id} items={personIds} strategy={verticalListSortingStrategy}>
              {people.map(person => (
                <PeopleKanbanCard key={person.id} person={person} dragHappened={dragHappened} onEdit={onEditPerson} />
              ))}
            </SortableContext>
            {people.length === 0 && (
               <div className="flex items-center justify-center h-20 m-2 border-2 border-dashed border-border rounded-lg">
                <p className="text-sm text-muted-foreground">Drop here</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PeopleKanbanColumn;