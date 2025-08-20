import { Project } from '@/types';
import KanbanCard from './KanbanCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: string;
  projects: Project[];
}

const KanbanColumn = ({ status, projects }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: 'Column',
      status,
    },
  });

  return (
    <div className="w-72 flex-shrink-0">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-semibold">{status}</h3>
        <span className="text-sm text-muted-foreground bg-background px-2 py-0.5 rounded-full">{projects.length}</span>
      </div>
      <div 
        ref={setNodeRef} 
        className={cn(
          "h-[calc(100vh-320px)] overflow-y-auto p-2 rounded-lg bg-muted/50 transition-colors",
          isOver && "bg-primary/10"
        )}
      >
        <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {projects.map(project => (
            <KanbanCard key={project.id} project={project} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;