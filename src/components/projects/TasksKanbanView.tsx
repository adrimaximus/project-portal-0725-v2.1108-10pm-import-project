import { useMemo, useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, TASK_STATUS_OPTIONS } from '@/types';
import TasksKanbanColumn from './TasksKanbanColumn';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
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
  const isOptimisticUpdate = useRef(false);

  useEffect(() => {
    if (isOptimisticUpdate.current) {
      isOptimisticUpdate.current = false;
      return;
    }

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

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeContainer = active.data.current?.sortable.containerId as TaskStatus;
    const overContainer = (over.data.current?.sortable?.containerId || over.id) as TaskStatus;

    if (!activeContainer || !overContainer) {
        console.error("Could not determine drag and drop containers.");
        return;
    }

    let finalTasksByStatusState: Record<TaskStatus, Task[]>;

    if (activeContainer === overContainer) {
        const items = tasksByStatus[activeContainer];
        if (!Array.isArray(items)) return;

        const oldIndex = items.findIndex(t => t.id === activeId);
        const newIndex = items.findIndex(t => t.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            finalTasksByStatusState = {
                ...tasksByStatus,
                [activeContainer]: arrayMove(items, oldIndex, newIndex),
            };
        } else {
            finalTasksByStatusState = tasksByStatus;
        }
    } else {
        const sourceItems = tasksByStatus[activeContainer];
        const destItems = tasksByStatus[overContainer];
        if (!Array.isArray(sourceItems) || !Array.isArray(destItems)) return;

        const activeIndex = sourceItems.findIndex(t => t.id === activeId);
        if (activeIndex !== -1) {
            const [movedItem] = sourceItems.slice(activeIndex, activeIndex + 1);
            const newSourceItems = sourceItems.filter(t => t.id !== activeId);
            
            const newDestItems = [...destItems];
            const overIndex = destItems.findIndex(t => t.id === overId);
            
            if (overIndex !== -1) {
                newDestItems.splice(overIndex, 0, { ...movedItem, status: overContainer });
            } else {
                newDestItems.push({ ...movedItem, status: overContainer });
            }

            finalTasksByStatusState = {
                ...tasksByStatus,
                [activeContainer]: newSourceItems,
                [overContainer]: newDestItems,
            };
        } else {
            finalTasksByStatusState = tasksByStatus;
        }
    }

    isOptimisticUpdate.current = true;
    setTasksByStatus(finalTasksByStatusState);

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
    });
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveTask(null)}>
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