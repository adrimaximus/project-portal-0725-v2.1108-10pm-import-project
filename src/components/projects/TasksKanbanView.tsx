import { useMemo, useState, useEffect } from 'react';
import { Task, TaskStatus, TASK_STATUS_OPTIONS } from '@/types';
import TasksKanbanColumn from './TasksKanbanColumn';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import TasksKanbanCard from './TasksKanbanCard';
import { useTaskMutations } from '@/hooks/useTaskMutations';

interface TasksKanbanViewProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  hideCompletedTasks: boolean;
}

const TasksKanbanView = ({ tasks, onStatusChange, onEdit, onDelete, hideCompletedTasks }: TasksKanbanViewProps) => {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<TaskStatus>>(new Set());
  const [internalTasks, setInternalTasks] = useState<Task[]>(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { updateTaskStatusAndOrder } = useTaskMutations();

  useEffect(() => {
    setInternalTasks(tasks);
  }, [tasks]);

  const columnsToRender = useMemo(() => {
    if (hideCompletedTasks) {
      return TASK_STATUS_OPTIONS.filter(opt => opt.value !== 'Done');
    }
    return TASK_STATUS_OPTIONS;
  }, [hideCompletedTasks]);

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

    // Sort tasks in each column by last updated date
    for (const status in grouped) {
      grouped[status as TaskStatus].sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      });
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

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const oldTasks = [...internalTasks];
    const activeIndex = oldTasks.findIndex(t => t.id === activeId);
    let overIndex = oldTasks.findIndex(t => t.id === overId);

    if (activeIndex === -1) return;

    const activeTask = oldTasks[activeIndex];
    const overTask = overIndex !== -1 ? oldTasks[overIndex] : null;
    
    const newStatus = overTask ? overTask.status : (overId as TaskStatus);

    if (overIndex === -1) { // Dropped on a column, not a task
        const tasksInTargetColumn = oldTasks.filter(t => t.status === newStatus);
        if (tasksInTargetColumn.length > 0) {
            overIndex = oldTasks.findIndex(t => t.id === tasksInTargetColumn[0].id);
        } else {
            const columnOrder = TASK_STATUS_OPTIONS.map(o => o.value);
            const newStatusIndex = columnOrder.indexOf(newStatus);
            let nextTask: Task | undefined;
            for (let i = newStatusIndex + 1; i < columnOrder.length; i++) {
                nextTask = oldTasks.find(t => t.status === columnOrder[i]);
                if (nextTask) break;
            }
            
            if (nextTask) {
                overIndex = oldTasks.findIndex(t => t.id === nextTask!.id);
            } else {
                overIndex = oldTasks.length;
            }
        }
    }

    // Optimistic update
    const newTasksOptimistic = arrayMove(oldTasks, activeIndex, overIndex);
    const movedItemIndexInNew = newTasksOptimistic.findIndex(t => t.id === activeId);
    if (movedItemIndexInNew !== -1) {
      newTasksOptimistic[movedItemIndexInNew] = { ...newTasksOptimistic[movedItemIndexInNew], status: newStatus };
    }

    setInternalTasks(newTasksOptimistic);

    // Call mutation
    const finalTaskIds = newTasksOptimistic.map(t => t.id);
    updateTaskStatusAndOrder({ 
        taskId: activeId, 
        newStatus, 
        orderedTaskIds: finalTaskIds 
    });
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-2 sm:p-4 h-full">
        {columnsToRender.map(option => (
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