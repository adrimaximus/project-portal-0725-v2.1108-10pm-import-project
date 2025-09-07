import React, { useMemo } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Person, Tag } from '@/types';
import PeopleKanbanCard from './PeopleKanbanCard';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ChevronsLeft, GripVertical } from 'lucide-react';

const PeopleKanbanColumn = ({ tag, people, dragHappened, onEditPerson, onDeletePerson, isCollapsed, onToggleCollapse }: { 
  tag: Tag | { id: string, name: string, color: string }, 
  people: Person[], 
  dragHappened: React.MutableRefObject<boolean>, 
  onEditPerson: (person: Person) => void,
  onDeletePerson: (person: Person) => void,
  isCollapsed: boolean,
  onToggleCollapse: (tagId: string) => void,
}) => {
  const personIds = useMemo(() => people.map(p => p.id), [people]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tag.id,
    data: {
      type: 'Column',
      tag,
    },
    disabled: isCollapsed,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex-shrink-0 h-full",
          isCollapsed ? "w-14" : "w-72",
          "bg-muted/80 rounded-lg border-2 border-dashed border-primary"
        )}
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(
      "flex-shrink-0 transition-all duration-300 ease-in-out",
      isCollapsed ? "w-14" : "w-72"
    )}>
      <div className="h-full flex flex-col bg-muted/50 rounded-lg">
        {/* Header */}
        <div className="font-semibold p-3 text-base flex items-center justify-between flex-shrink-0">
          {!isCollapsed && (
            <div className="flex items-center truncate">
              <Button variant="ghost" size="icon" {...attributes} {...listeners} className="cursor-grab h-7 w-7 mr-1">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
              <span className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: tag.color }}></span>
              <span className="truncate">{tag.name}</span>
              <Badge variant="secondary" className="ml-2">{people.length}</Badge>
            </div>
          )}
          {isCollapsed && <div className="flex-1" /> /* spacer */}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleCollapse(tag.id)}>
            <ChevronsLeft className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Content */}
        {isCollapsed ? (
          <div className="flex-grow min-h-0 flex items-center justify-center cursor-pointer p-3" onClick={() => onToggleCollapse(tag.id)}>
            <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap flex items-center gap-2 text-sm font-medium">
              <span className="truncate">{tag.name}</span>
              <Badge variant="secondary">{people.length}</Badge>
            </div>
          </div>
        ) : (
          <div className="flex-grow min-h-0 overflow-y-auto p-2 pt-0">
            <SortableContext id={tag.id} items={personIds} strategy={verticalListSortingStrategy}>
              {people.map(person => (
                <PeopleKanbanCard key={person.id} person={person} dragHappened={dragHappened} onEdit={onEditPerson} onDelete={onDeletePerson} />
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