import { useMemo, useState, useEffect } from 'react';
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
}

const TasksKanbanView = ({ tasks, onEdit, onDelete, refetch }: TasksKanbanViewProps) => {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(new Set());
  const [internalTasks, setInternalTasks] = useState<Task[]>(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { updateTaskStatusAndOrder } = useTaskMutations(refetch);

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
    const grouped: { [key in TaskStatus]: Task[] } = TASK_STATUS_OPTIONS.reduce((acc, opt) => {
      acc[opt.value] = [];
      return acc;
    }, {} as { [key in TaskStatus]: Task[] });

    internalTasks.forEach(task => {
      const status = task.status || 'To do';
      if (grouped[status]) {
        grouped[status].push(task);
      } else {
        grouped['To do'].push(task);
      }
    });

    // Sort tasks in each column by their kanban_order
    for (const status in grouped) {
      grouped[status as TaskStatus].sort((a, b) => (a.kanban_order || 0) - (b.kanban_order || 0));
    }

    return grouped;
  }, [internalTasks]);

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

    const activeContainer = active.data.current?.sortable.containerId as TaskStatus;
    const overIsItem = !!over.data.current?.sortable;
    const overContainer = overIsItem ? (over.data.current?.sortable.containerId as TaskStatus) : (over.id as TaskStatus);

    if (!activeContainer || !overContainer) return;

    // Create a mutable copy of the grouped tasks
    const newGroups = { ...tasksByStatus };
    const sourceItems = [...(newGroups[activeContainer] || [])];
    const activeIndex = sourceItems.findIndex(t => t.id === activeId);
    if (activeIndex === -1) return;

    const [movedItem] = sourceItems.splice(activeIndex, 1);
    newGroups[activeContainer] = sourceItems;

    if (activeContainer === overContainer) {
      const overIndex = sourceItems.findIndex(t => t.id === overId);
      sourceItems.splice(overIndex, 0, movedItem);
    } else {
      movedItem.status = overContainer;
      const destItems = [...(newGroups[overContainer] || [])];
      const overIndex = overIsItem ? destItems.findIndex(t => t.id === overId) : destItems.length;
      destItems.splice(overIndex, 0, movedItem);
      newGroups[overContainer] = destItems;
    }

    // Flatten the new groups back into a single array for state and API
    const newFlatTasks = TASK_STATUS_OPTIONS.flatMap(opt => newGroups[opt.value] || []);
    
    // Optimistic UI update
    setInternalTasks(newFlatTasks);

    // Call mutation
    const finalTaskIds = newFlatTasks.map(t => t.id);
    updateTaskStatusAndOrder({ 
        taskId: activeId, 
        newStatus: overContainer, 
        orderedTaskIds: finalTaskIds 
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