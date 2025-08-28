import { useMemo, useState, useEffect } from 'react';
import { Task, TaskStatus, TASK_STATUS_OPTIONS } from '@/types/task';
import TasksKanbanColumn from './TasksKanbanColumn';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import TasksKanbanCard from './TasksKanbanCard';

interface TasksKanbanViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const TasksKanbanView = ({ tasks, onStatusChange }: TasksKanbanViewProps) => {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(new Set());
  const [internalTasks, setInternalTasks] = useState<Task[]>(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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
        delay: 250,
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

    if (activeId === overId) return;

    const activeTask = internalTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const overIsColumn = TASK_STATUS_OPTIONS.some(opt => opt.value === overId);
    const overTask = internalTasks.find((t) => t.id === overId);

    if (!overTask && !overIsColumn) return;

    const oldStatus = activeTask.status;
    const newStatus = overTask ? overTask.status : (overId as TaskStatus);

    setInternalTasks((currentTasks) => {
      const oldIndex = currentTasks.findIndex((t) => t.id === activeId);
      const newIndex = overTask ? currentTasks.findIndex((t) => t.id === overId) : -1;

      let reorderedTasks;

      if (oldStatus === newStatus) {
        // Reordering within the same column
        if (newIndex === -1) return currentTasks;
        reorderedTasks = arrayMove(currentTasks, oldIndex, newIndex);
      } else {
        // Moving to a different column
        const updatedTask = { ...currentTasks[oldIndex], status: newStatus };
        
        // Create a new array with the task removed
        let tasksWithoutActive = currentTasks.filter(t => t.id !== activeId);

        let insertionIndex;
        if (overTask) {
          insertionIndex = tasksWithoutActive.findIndex(t => t.id === overId);
        } else { // Dropped on an empty column
          const lastTaskInNewColumn = [...tasksWithoutActive].reverse().find(t => t.status === newStatus);
          if (lastTaskInNewColumn) {
            insertionIndex = tasksWithoutActive.findIndex(t => t.id === lastTaskInNewColumn.id) + 1;
          } else {
            const allStatuses = TASK_STATUS_OPTIONS.map(o => o.value);
            const targetStatusIndex = allStatuses.indexOf(newStatus);
            let foundNextColumn = false;
            for (let i = targetStatusIndex + 1; i < allStatuses.length; i++) {
              const nextStatus = allStatuses[i];
              const firstTaskOfNextColIndex = tasksWithoutActive.findIndex(t => t.status === nextStatus);
              if (firstTaskOfNextColIndex !== -1) {
                insertionIndex = firstTaskOfNextColIndex;
                foundNextColumn = true;
                break;
              }
            }
            if (!foundNextColumn) {
              insertionIndex = tasksWithoutActive.length;
            }
          }
        }
        
        tasksWithoutActive.splice(insertionIndex, 0, updatedTask);
        reorderedTasks = tasksWithoutActive;
        onStatusChange(activeId, newStatus);
      }
      
      return reorderedTasks;
    });
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
      <DragOverlay>
        {activeTask ? <TasksKanbanCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TasksKanbanView;