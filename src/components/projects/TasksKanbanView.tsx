import { useMemo, useState } from 'react';
import { Task, TaskStatus, TASK_STATUS_OPTIONS } from '@/types';
import TasksKanbanColumn from './TasksKanbanColumn';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import TasksKanbanCard from './TasksKanbanCard';
import { useTaskMutations } from '@/hooks/useTaskMutations';

interface TasksKanbanViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  refetch: () => void;
  tasksQueryKey: any[];
}

const TasksKanbanView = ({ tasks, onEdit, onDelete, refetch, tasksQueryKey }: TasksKanbanViewProps) => {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(new Set());
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { updateTaskStatusAndOrder } = useTaskMutations(refetch);

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

    return grouped;
  }, [tasks]);

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

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeContainer = active.data.current?.sortable.containerId as TaskStatus;
    const overIsItem = !!over.data.current?.sortable;
    const overContainer = overIsItem ? (over.data.current?.sortable.containerId as TaskStatus) : (over.id as TaskStatus);

    if (!activeContainer || !overContainer) return;

    const activeIndex = tasks.findIndex(t => t.id === activeId);
    if (activeIndex === -1) return;

    let newTasks: Task[];

    if (activeContainer === overContainer) {
      const overIndex = tasks.findIndex(t => t.id === overId);
      if (overIndex === -1) return;
      newTasks = arrayMove(tasks, activeIndex, overIndex);
    } else {
      const movedItem = { ...tasks[activeIndex], status: overContainer, completed: overContainer === 'Done' };
      const remainingItems = tasks.filter(t => t.id !== activeId);
      
      const overIndex = overIsItem ? remainingItems.findIndex(t => t.id === overId) : -1;
      
      if (overIndex !== -1) {
        remainingItems.splice(overIndex, 0, movedItem);
      } else {
        const itemsInDest = remainingItems.filter(t => t.status === overContainer);
        if (itemsInDest.length > 0) {
          const lastItem = itemsInDest.sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0)).pop();
          const lastItemIndex = remainingItems.findIndex(t => t.id === lastItem!.id);
          remainingItems.splice(lastItemIndex + 1, 0, movedItem);
        } else {
          remainingItems.push(movedItem);
        }
      }
      newTasks = remainingItems;
    }

    const newTasksWithOrder = newTasks.map((task, index) => ({
      ...task,
      kanban_order: index,
    }));

    const orderedTaskIds = newTasksWithOrder.map(t => t.id);

    updateTaskStatusAndOrder({ 
        taskId: activeId, 
        newStatus: overContainer, 
        orderedTaskIds: orderedTaskIds,
        newTasks: newTasksWithOrder,
        queryKey: tasksQueryKey,
    });
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