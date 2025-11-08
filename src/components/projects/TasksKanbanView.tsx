import { useMemo, useState, useEffect } from 'react';
import { Task, TaskStatus, TASK_STATUS_OPTIONS } from '@/types';
import TasksKanbanColumn from './TasksKanbanColumn';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import TasksKanbanCard from './TasksKanbanCard';

interface TasksKanbanViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  refetch: () => void;
  tasksQueryKey: any[];
  onTaskOrderChange: (payload: any) => void;
}

const TasksKanbanView = ({ tasks, onEdit, onDelete, refetch, tasksQueryKey, onTaskOrderChange }: TasksKanbanViewProps) => {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(new Set());
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [tasksByStatus, setTasksByStatus] = useState<Record<TaskStatus, Task[]>>({} as Record<TaskStatus, Task[]>);

  useEffect(() => {
    if (!activeTask) {
      const grouped: { [key in TaskStatus]: Task[] } = TASK_STATUS_OPTIONS.reduce((acc, opt) => {
        acc[opt.value] = [];
        return acc;
      }, {} as { [key in TaskStatus]: Task[] });
  
      tasks.forEach(task => {
        const status = task.status || 'To do';
        if (grouped[status]) {
          grouped[status].push(task);
        } else {
          grouped['To do'].push(task);
        }
      });
  
      for (const status in grouped) {
        grouped[status as TaskStatus].sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
      }
      setTasksByStatus(grouped);
    }
  }, [tasks, activeTask]);

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

  const sensors = useSensors(
    useSensor(MouseSensor, {
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
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const activeContainer = active.data.current?.sortable.containerId as TaskStatus;
    const overIsItem = !!over.data.current?.sortable;
    const overContainer = overIsItem ? (over.data.current?.sortable.containerId as TaskStatus) : (over.id as TaskStatus);

    if (!activeContainer || !overContainer) return;

    setTasksByStatus(prev => {
      const newGroups = { ...prev };
      const sourceItems = newGroups[activeContainer];
      const destItems = newGroups[overContainer];
      if (!sourceItems || !destItems) return prev;

      const activeIndex = sourceItems.findIndex(t => t.id === activeId);
      if (activeIndex === -1) return prev;

      const [movedItem] = sourceItems.splice(activeIndex, 1);

      if (activeContainer === overContainer) {
        const overIndex = destItems.findIndex(t => t.id === overId);
        if (overIndex !== -1) {
          destItems.splice(overIndex, 0, movedItem);
        }
      } else {
        movedItem.status = overContainer;
        const overIndex = overIsItem ? destItems.findIndex(t => t.id === overId) : destItems.length;
        if (overIndex !== -1) {
          destItems.splice(overIndex, 0, movedItem);
        } else {
          destItems.push(movedItem);
        }
      }
      return newGroups;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overIsItem = !!over.data.current?.sortable;
    const overContainer = overIsItem ? (over.data.current?.sortable.containerId as TaskStatus) : (over.id as TaskStatus);

    const newTasks = Object.values(tasksByStatus).flat();
    const orderedTaskIds = newTasks.map(t => t.id);

    onTaskOrderChange({ 
        taskId: activeId, 
        newStatus: overContainer, 
        orderedTaskIds: orderedTaskIds,
        newTasks: newTasks,
        queryKey: tasksQueryKey,
    });
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={() => setActiveTask(null)}>
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