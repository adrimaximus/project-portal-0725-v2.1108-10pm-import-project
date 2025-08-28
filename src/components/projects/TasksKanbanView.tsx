import { useMemo } from 'react';
import { Task, TaskStatus, TASK_STATUS_OPTIONS } from '@/types/task';
import TasksKanbanColumn from './TasksKanbanColumn';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';

interface TasksKanbanViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const TasksKanbanView = ({ tasks, onStatusChange }: TasksKanbanViewProps) => {
  const tasksByStatus = useMemo(() => {
    const grouped: { [key in TaskStatus]?: Task[] } = {};
    TASK_STATUS_OPTIONS.forEach(opt => {
      grouped[opt.value] = [];
    });
    tasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status]!.push(task);
      } else {
        // Fallback for any tasks with a status not in options
        if (!grouped['To do']) grouped['To do'] = [];
        grouped['To do']!.push(task);
      }
    });
    return grouped as { [key in TaskStatus]: Task[] };
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const overIsColumn = TASK_STATUS_OPTIONS.some(opt => opt.value === over.id);
      
      if (overIsColumn) {
        const taskId = active.id as string;
        const newStatus = over.id as TaskStatus;
        const oldStatus = Object.keys(tasksByStatus).find(status => tasksByStatus[status as TaskStatus].some(t => t.id === taskId)) as TaskStatus;

        if (oldStatus && newStatus && oldStatus !== newStatus) {
          onStatusChange(taskId, newStatus);
        }
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map(t => t.id)}>
        <div className="flex gap-4 overflow-x-auto p-4 h-full">
          {TASK_STATUS_OPTIONS.map(option => (
            <TasksKanbanColumn
              key={option.value}
              status={option.value}
              tasks={tasksByStatus[option.value] || []}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default TasksKanbanView;