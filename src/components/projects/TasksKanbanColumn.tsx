import { Task, TaskStatus } from '@/types/task';
import TasksKanbanCard from './TasksKanbanCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

interface TasksKanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
}

const TasksKanbanColumn = ({ status, tasks }: TasksKanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div ref={setNodeRef} className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-[280px] flex-shrink-0">
      <div className="bg-muted rounded-lg h-full flex flex-col">
        <h3 className="text-base font-semibold p-4 border-b sticky top-0 bg-muted z-10">{status} ({tasks.length})</h3>
        <div className="flex-grow p-4 overflow-y-auto">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <TasksKanbanCard key={task.id} task={task} />
            ))}
            {tasks.length === 0 && <div className="h-full w-full" />}
          </SortableContext>
        </div>
      </div>
    </div>
  );
};

export default TasksKanbanColumn;