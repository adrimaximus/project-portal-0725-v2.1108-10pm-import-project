import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Project } from '@/types';
import KanbanCard from './KanbanCard';
import { Badge } from '../ui/badge';

const KanbanColumn = ({ status, projects, dragHappened }: { status: { value: string, label: string }, projects: Project[], dragHappened: React.MutableRefObject<boolean> }) => {
  const { setNodeRef } = useDroppable({ id: status.value });
  const projectIds = useMemo(() => projects.map(p => p.id), [projects]);

  return (
    <div 
      ref={setNodeRef} 
      className="flex-shrink-0 w-72"
    >
      <div className="h-full flex flex-col">
        <h3 className="font-semibold mb-4 px-1 text-base flex items-center">
          {status.label}
          <Badge variant="secondary" className="ml-2">{projects.length}</Badge>
        </h3>
        <div className="bg-muted/50 rounded-lg p-2 min-h-[400px] h-full w-full">
          <SortableContext id={status.value} items={projectIds} strategy={verticalListSortingStrategy}>
            {projects.map(project => (
              <KanbanCard key={project.id} project={project} dragHappened={dragHappened} />
            ))}
          </SortableContext>
        </div>
      </div>
    </div>
  );
};

export default KanbanColumn;