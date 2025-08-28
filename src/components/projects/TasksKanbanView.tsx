import { useMemo, useState, useEffect } from 'react';
import { Task, TaskStatus, TASK_STATUS_OPTIONS } from '@/types/task';
import TasksKanbanColumn from './TasksKanbanColumn';
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';

interface TasksKanbanViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const TasksKanbanView = ({ tasks, onStatusChange }: TasksKanbanViewProps) => {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(new Set());
  const [internalTasks, setInternalTasks] = useState<Task[]>(tasks);

  useEffect(() => {
    setInternalTasks(tasks);
  }, [tasks]);

  const toggleColumnCollapse = (status: TaskStatus) => {
    setCollapsedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const tasksByStatus = useMemo(() => {
    const grouped: { [key in TaskStatus]?: Task[] } = {};
    TASK_STATUS_OPTIONS.forEach(opt => {
      grouped[opt.value] = [];
    });
    internalTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status]!.push(task);
      } else {
        if (!grouped['To do']) grouped['To do'] = [];
        grouped['To do']!.push(task);
      }
    });
    return grouped as { [key in TaskStatus]: Task[] };
  }, [internalTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;

    const activeTask = internalTasks.find(t => t.id === activeId);
    if (!activeTask) return;

    const oldStatus = activeTask.status;
    let newStatus: TaskStatus | undefined;

    const overIsColumn = TASK_STATUS_OPTIONS.some(opt => opt.value === overId);
    if (overIsColumn) {
        newStatus = overId as TaskStatus;
    } else {
        const overTask = internalTasks.find(t => t.id === overId);
        if (overTask) {
            newStatus = overTask.status;
        }
    }

    if (newStatus && newStatus !== oldStatus) {
        setInternalTasks(currentTasks => 
            currentTasks.map(t => 
                t.id === activeId ? { ...t, status: newStatus! } : t
            )
        );
        onStatusChange(activeId, newStatus);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4 h-full">
        {TASK_STATUS_OPTIONS.map(option => (
          <TasksKanbanColumn
            key={option.value}
            status={option.value}
            tasks={tasksByStatus[option.value] || []}
            isCollapsed={collapsedColumns.has(option.value)}
            onToggleCollapse={toggleColumnCollapse}
          />
        ))}
      </div>
    </DndContext>
  );
};

export default TasksKanbanView;