import { Task, TaskStatus } from '@/types/task';
import TasksKanbanCard from './TasksKanbanCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TasksKanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  isCollapsed: boolean;
  onToggleCollapse: (status: TaskStatus) => void;
}

const TasksKanbanColumn = ({ status, tasks, isCollapsed, onToggleCollapse }: TasksKanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <Collapsible
      open={!isCollapsed}
      onOpenChange={() => onToggleCollapse(status)}
      className={cn(
        "w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-[280px] flex-shrink-0 transition-all duration-300 ease-in-out rounded-lg",
        isCollapsed && "xl:w-[60px]"
      )}
    >
      <div ref={setNodeRef} className="bg-muted h-full flex flex-col rounded-lg">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-muted-foreground/10 rounded-t-lg">
            <h3 className={cn("text-base font-semibold", isCollapsed && "hidden")}>
              {status} <span className="text-muted-foreground font-normal">({tasks.length})</span>
            </h3>
            <div className="flex items-center">
                {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex-grow p-2 overflow-y-auto">
          {isCollapsed ? (
             <div className="flex justify-center items-start pt-4">
                <span className="writing-mode-vertical-rl rotate-180 text-sm font-semibold text-muted-foreground">{status}</span>
             </div>
          ) : (
            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="p-2">
                {tasks.map(task => (
                  <TasksKanbanCard key={task.id} task={task} />
                ))}
                {tasks.length === 0 && <div className="h-full w-full min-h-[100px]" />}
              </div>
            </SortableContext>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default TasksKanbanColumn;