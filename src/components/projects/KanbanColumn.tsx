import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Project } from '@/types';
import KanbanCard from './KanbanCard';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ChevronsLeft } from 'lucide-react';

interface KanbanColumnProps {
  status: { value: string, label: string };
  projects: Project[];
  dragHappened: React.MutableRefObject<boolean>;
  isCollapsed: boolean;
  onToggleCollapse: (columnId: string) => void;
}

const KanbanColumn = ({ status, projects, dragHappened, isCollapsed, onToggleCollapse }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status.value });
  const projectIds = useMemo(() => projects.map(p => p.id), [projects]);

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "flex-shrink-0 transition-all duration-300 ease-in-out h-full flex flex-col bg-muted/50 rounded-lg max-h-[900px]",
        isCollapsed ? "w-14" : "w-[280px] sm:w-72"
      )}
    >
      {/* Header */}
      <div className="font-semibold p-3 text-base flex items-center justify-between flex-shrink-0">
        {!isCollapsed && (
          <h3 className="flex items-center truncate">
            <span className="truncate">{status.label}</span>
            <Badge variant="secondary" className="ml-2">{projects.length}</Badge>
          </h3>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleCollapse(status.value)}>
          <ChevronsLeft className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
        </Button>
      </div>
      
      {/* Content */}
      {isCollapsed ? (
        <div className="flex-grow min-h-0 flex items-center justify-center cursor-pointer" onClick={() => onToggleCollapse(status.value)}>
          <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap flex items-center gap-2 text-sm font-medium">
            <span className="truncate">{status.label}</span>
            <Badge variant="secondary">{projects.length}</Badge>
          </div>
        </div>
      ) : (
        <div className="flex-grow min-h-0 overflow-y-auto p-2 pt-0">
          <SortableContext id={status.value} items={projectIds} strategy={verticalListSortingStrategy}>
            {projects.map(project => (
              <KanbanCard key={project.id} project={project} dragHappened={dragHappened} />
            ))}
          </SortableContext>
          {projects.length === 0 && (
             <div className="flex items-center justify-center h-20 m-2 border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Drop here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KanbanColumn;