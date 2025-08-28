import { useMemo, useState, useEffect } from 'react';
import { Task, TaskStatus, TASK_STATUS_OPTIONS } from '@/types/task';
import TasksKanbanColumn from './TasksKanbanColumn';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import TasksKanbanCard from './TasksKanbanCard';
import { useTaskMutations } from '@/hooks/useTaskMutations';

interface TasksKanbanViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TasksKanbanView = ({ tasks, onStatusChange, onEdit, onDelete }: TasksKanbanViewProps) => {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(new Set());
  const [internalTasks, setInternalTasks] = useState<Task[]>(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { updateTaskOrder, moveTask } = useTaskMutations();

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
      const status = task.status || 'To do';
      if (grouped[status]) {
        grouped[status]!.push(task);
      } else {
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
        delay: 2000,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = internalTasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeTaskIndex = internalTasks.findIndex((t) => t.id === activeId);
    if (activeTaskIndex === -1) return;

    const activeTask = internalTasks[activeTaskIndex];
    const oldStatus = activeTask.status;

    const overIsColumn = TASK_STATUS_OPTIONS.some(opt => opt.value === overId);
    const overTask = internalTasks.find((t) => t.id === overId);
    
    if (activeId === overId && !overIsColumn) return;
    if (!overTask && !overIsColumn) return;

    const newStatus = overTask ? overTask.status : (overId as TaskStatus);

    let reorderedTasks = [...internalTasks];

    if (oldStatus === newStatus) {
      const overTaskIndex = internalTasks.findIndex((t) => t.id === overId);
      if (overTaskIndex !== -1) {
        reorderedTasks = arrayMove(reorderedTasks, activeTaskIndex, overTaskIndex);
      }
    } else {
      reorderedTasks[activeTaskIndex] = { ...activeTask, status: newStatus };

      let overIndex = overTask ? reorderedTasks.findIndex((t) => t.id === overId) : -1;
      if (overIndex === -1 && overIsColumn) {
        overIndex = reorderedTasks.findIndex(t => t.status === newStatus);
        if (overIndex === -1) {
          const columnOrder = TASK_STATUS_OPTIONS.map(o => o.value);
          const newStatusIndex = columnOrder.indexOf(newStatus);
          let insertAtIndex = reorderedTasks.length;
          for (let i = newStatusIndex + 1; i < columnOrder.length; i++) {
            const nextStatus = columnOrder[i];
            const firstIndexOfNextCol = reorderedTasks.findIndex(t => t.status === nextStatus);
            if (firstIndexOfNextCol !== -1) {
              insertAtIndex = firstIndexOfNextCol;
              break;
            }
          }
          overIndex = insertAtIndex;
        }
      }
      reorderedTasks = arrayMove(reorderedTasks, activeTaskIndex, overIndex);
    }

    setInternalTasks(reorderedTasks);
    
    const finalTaskIds = reorderedTasks.map(t => t.id);
    if (oldStatus === newStatus) {
      updateTaskOrder(finalTaskIds);
    } else {
      moveTask({ taskId: activeId, newStatus, orderedTaskIds: finalTaskIds });
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-2 sm:p-4 h-full">
        {TASK_STATUS_OPTIONS.map(option => (
          <TasksKanbanColumn
            key={option.value}
            status={option.value}
            tasks={tasksByStatus[option.value] || []}
            isCollapsed={collapsedColumns.has(option.value)}
            onToggleCollapse={toggleColumnCollapse}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TasksKanbanCard task={activeTask} onEdit={onEdit} onDelete={onDelete} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TasksKanbanView;