import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Project } from '@/types';
import KanbanCard from './KanbanCard';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

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

  const handleToggle = () => {
    if (projects.length === 0) {
      onToggleCollapse(status.value);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "flex-shrink-0 transition-all duration-300",
        isCollapsed ? "w-16" : "w-72"
      )}
      onDoubleClick={handleToggle}
    >
      <div className="h-full flex flex-col">
        <div className="font-semibold mb-4 px-1 text-base flex items-center justify-between flex-shrink-0">
          {!isCollapsed && (
            <h3 className="flex items-center truncate">
              <span className="truncate">{status.label}</span>
            </h3>
          )}
          {!isCollapsed && <Badge variant="secondary" className="ml-2">{projects.length}</Badge>}
        </div>
        
        <div className="flex-grow min-h-0">
          {isCollapsed ? (
            <div className="flex items-center justify-center h-full cursor-pointer">
              <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap flex items-center gap-2">
                <span className="font-semibold">{status.label}</span>
                <Badge variant="secondary">{projects.length}</Badge>
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-2 min-h-[400px] h-full w-full">
              <SortableContext id={status.value} items={projectIds} strategy={verticalListSortingStrategy}>
                {projects.map(project => (
                  <KanbanCard key={project.id} project={project} dragHappened={dragHappened} />
                ))}
              </SortableContext>
              {projects.length === 0 && (
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

export default KanbanColumn;