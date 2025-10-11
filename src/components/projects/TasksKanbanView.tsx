import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

type Task = {
  id: string;
  title: string;
  status: string;
  project_name: string;
  project_slug: string;
  assignees: { id: string; avatar_url: string; first_name: string; last_name: string }[];
};

const TaskCard = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { type: 'Task', task } });
  const style = { transition, transform: CSS.Transform.toString(transform), opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-2">
        <CardContent className="p-3">
          <p className="font-medium">{task.title}</p>
          <div className="flex justify-between items-center mt-2">
            <Badge variant="secondary">{task.project_name}</Badge>
            <div className="flex -space-x-2">
              {task.assignees.map(assignee => (
                <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={assignee.avatar_url} />
                  <AvatarFallback>{assignee.first_name?.[0]}{assignee.last_name?.[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const KanbanColumn = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => {
  const { setNodeRef } = useSortable({ id });
  return (
    <div ref={setNodeRef} className="w-72 flex-shrink-0">
      <Card className="bg-muted/50">
        <CardHeader className="p-4">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-2 min-h-[200px]">
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

const TasksKanbanView = () => {
  const queryClient = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_project_tasks');
      if (error) throw new Error(error.message);
      return data as Task[];
    },
  });

  const { mutate: updateTaskStatus } = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
      if (error) throw error;
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);
      queryClient.setQueryData<Task[]>(['tasks'], old => old?.map(t => t.id === taskId ? { ...t, status } : t));
      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['tasks'], context?.previousTasks);
      toast.error('Failed to move task');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const columns = useMemo(() => {
    const statuses = ['To do', 'In progress', 'In review', 'Done'];
    return statuses.map(status => ({
      id: status,
      title: status,
      tasks: tasks?.filter(task => task.status === status) || [],
    }));
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = active.data.current?.sortable.containerId;
    const overContainer = over.data.current?.sortable.containerId || over.id;

    if (activeContainer !== overContainer) {
      updateTaskStatus({ taskId: String(activeId), status: String(overContainer) });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} closestCenter={closestCenter}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        <SortableContext items={columns.map(c => c.id)}>
          {columns.map(column => (
            <KanbanColumn key={column.id} id={column.id} title={column.title}>
              <SortableContext items={column.tasks.map(t => t.id)}>
                {column.tasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </SortableContext>
            </KanbanColumn>
          ))}
        </SortableContext>
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TasksKanbanView;