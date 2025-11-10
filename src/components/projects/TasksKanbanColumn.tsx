import { Task, TaskStatus } from '@/types';
import TasksKanbanCard from './TasksKanbanCard';
import { Badge } from '@/components/ui/badge';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMemo } from 'react';
import { Button } from '../ui/button';
import { ChevronsLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TasksKanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  isCollapsed: boolean;
  onToggleCollapse: (status: TaskStatus) => void;
  onTaskClick: (task: Task) => void;
}

const TasksKanbanColumn = ({ status, tasks, isCollapsed, onToggleCollapse, onTaskClick }: TasksKanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 transition-all duration-300 ease-in-out h-full flex flex-col bg-muted/50 rounded-lg max-h-[700px]",
        isCollapsed ? "w-14" : "w-72"
      )}
    >
      <div className="font-semibold p-3 text-base flex items-center justify-between flex-shrink-0">
        {!isCollapsed && (
          <h3 className="flex items-center gap-2 truncate">
            <span className="truncate">{statusLabel}</span>
            <Badge variant="secondary">{tasks.length}</Badge>
          </h3>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleCollapse(status)}>
          <ChevronsLeft className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
        </Button>
      </div>

      {isCollapsed ? (
        <div className="flex-grow min-h-0 flex items-center justify-center cursor-pointer p-3" onClick={() => onToggleCollapse(status)}>
          <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap flex items-center gap-2 text-sm font-medium">
            <span className="truncate">{statusLabel}</span>
            <Badge variant="secondary">{tasks.length}</Badge>
          </div>
        </div>
      ) : (
        <div className="flex-grow min-h-0 overflow-y-auto p-2 pt-0">
          <SortableContext id={status} items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <TasksKanbanCard key={task.id} task={task} onTaskClick={onTaskClick} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-20 m-2 border-2 border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">No tasks</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TasksKanbanColumn;