import { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus } from '@/types';
import TasksKanbanColumn from './TasksKanbanColumn';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragOverEvent, DropAnimation, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import TasksKanbanCard from './TasksKanbanCard';
import { TASK_STATUS_OPTIONS } from '@/data/projectOptions';

interface TasksKanbanViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  refetch: () => void;
  tasksQueryKey: any[];
  onTaskOrderChange: (payload: any) => void;
}

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

const TasksKanbanView = ({ tasks, onEdit, onDelete, refetch, tasksQueryKey, onTaskOrderChange }: TasksKanbanViewProps) => {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(new Set());
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [tasksByStatus, setTasksByStatus] = useState<Record<TaskStatus, Task[]>>({} as Record<TaskStatus, Task[]>);
  const justDropped = useRef(false);

  useEffect(() => {
    const savedState = localStorage.getItem('tasksKanbanCollapsedColumns');
    if (savedState) {
      setCollapsedColumns(new Set(JSON.parse(savedState)));
    }
  }, []);

  useEffect(() => {
    if (justDropped.current) {
      justDropped.current = false;
      return;
    }

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
  }, [tasks]);

  const toggleColumnCollapse = (status: TaskStatus) => {
    setCollapsedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      localStorage.setItem('tasksKanbanCollapsedColumns', JSON.stringify(Array.from(newSet)));
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
    const overContainer = (overIsItem ? over.data.current?.sortable.containerId : overId) as TaskStatus;

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setTasksByStatus((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];

      const activeIndex = activeItems.findIndex((t) => t.id === activeId);
      
      if (activeIndex === -1) {
        return prev;
      }

      const [movedItem] = activeItems.splice(activeIndex, 1);
      movedItem.status = overContainer;

      const overIndex = overIsItem ? overItems.findIndex((t) => t.id === overId) : overItems.length;
      
      if (overIndex !== -1) {
        overItems.splice(overIndex, 0, movedItem);
      } else {
        overItems.push(movedItem);
      }

      return {
        ...prev,
        [activeContainer]: [...activeItems],
        [overContainer]: [...overItems],
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeId = String(active.id);
    const activeContainer = active.data.current?.sortable.containerId as string;
    const overIsItem = !!over.data.current?.sortable;
    const overContainer = overIsItem ? over.data.current?.sortable.containerId as string : String(over.id);

    if (!activeContainer || !overContainer) {
        console.error("Could not determine drag and drop containers.");
        setActiveTask(null);
        return;
    }

    let finalTasksByStatusState = { ...tasksByStatus };

    if (activeContainer === overContainer) {
        const items = finalTasksByStatusState[activeContainer];
        if (!Array.isArray(items)) return;

        const oldIndex = items.findIndex(t => t.id === activeId);
        const newIndex = items.findIndex(t => t.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            finalTasksByStatusState = {
                ...finalTasksByStatusState,
                [activeContainer]: arrayMove(items, oldIndex, newIndex),
            };
        }
    }
    
    justDropped.current = true;
    setTasksByStatus(finalTasksByStatusState);
    setActiveTask(null);

    const finalOrderedTasks = TASK_STATUS_OPTIONS.flatMap(option => 
      (finalTasksByStatusState[option.value] || []).map((task, index) => ({ ...task, status: option.value, kanban_order: index }))
    );
    const orderedTaskIds = finalOrderedTasks.map(t => t.id);

    onTaskOrderChange({
      taskId: activeId,
      newStatus: overContainer,
      orderedTaskIds: orderedTaskIds,
      newTasks: finalOrderedTasks,
      queryKey: tasksQueryKey,
      movedColumns: activeContainer !== overContainer,
    });
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    // Revert any changes made by onDragOver by re-grouping from the original prop
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
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
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
      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? <TasksKanbanCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TasksKanbanView;