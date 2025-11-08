import { Task, TaskStatus } from '@/types';
import TasksKanbanCard from './TasksKanbanCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { ChevronsLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface TasksKanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  isCollapsed: boolean;
  onToggleCollapse: (status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TasksKanbanColumn = ({ status, tasks, isCollapsed, onToggleCollapse, onEdit, onDelete }: TasksKanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "flex-shrink-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-14" : "w-[280px] sm:w-72"
      )}
    >
      <div className="h-full flex flex-col bg-muted/50 rounded-lg">
        {/* Header */}
        <div className="font-semibold p-3 text-base flex items-center justify-between flex-shrink-0">
          {!isCollapsed && (
            <h3 className="flex items-center truncate">
              <span className="truncate">{status}</span>
              <Badge variant="secondary" className="ml-2">{tasks.length}</Badge>
            </h3>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleCollapse(status)}>
            <ChevronsLeft className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
          </Button>
        </div>
        
        {/* Content */}
        {isCollapsed ? (
          <div className="flex-grow min-h-0 flex items-center justify-center cursor-pointer" onClick={() => onToggleCollapse(status)}>
            <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap flex items-center gap-2 text-sm font-medium">
              <span className="truncate">{status}</span>
              <Badge variant="secondary">{tasks.length}</Badge>
            </div>
          </div>
        ) : (
          <div className="flex-grow min-h-0 overflow-y-auto p-2 pt-0">
            <SortableContext id={status} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {tasks.map(task => (
                <TasksKanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </SortableContext>
            {tasks.length === 0 && (
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

export default TasksKanbanColumn;