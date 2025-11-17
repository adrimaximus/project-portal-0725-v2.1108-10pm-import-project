import { useState, useMemo, useCallback, useRef } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useTaskMutations, UpdateTaskOrderPayload } from '@/hooks/useTaskMutations';
import { useSortConfig } from '@/hooks/useSortConfig';
import { useTaskModal } from '@/contexts/TaskModalContext';
import { useUnreadTasks } from '@/hooks/useUnreadTasks';
import { Task, UpsertTaskPayload, Project, TaskStatus } from '@/types';
import { toast } from 'sonner';
import { getProjectBySlug } from '@/lib/projectsApi';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import TasksTableView from './TasksTableView';
import TasksKanbanView from './TasksKanbanView';
import { Loader2 } from 'lucide-react';

interface ProjectTasksViewProps {
  view: 'tasks' | 'tasks-kanban';
  projectIds?: string[];
  hideCompletedTasks: boolean;
  searchTerm: string;
  highlightedTaskId: string | null;
  onHighlightComplete: () => void;
}

const ProjectTasksView = ({ view, projectIds, hideCompletedTasks, searchTerm, highlightedTaskId, onHighlightComplete }: ProjectTasksViewProps) => {
  const { onOpen: onOpenTaskModal } = useTaskModal();
  const { unreadTaskIds } = useUnreadTasks();
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());

  const { sortConfig, requestSort } = useSortConfig({ key: 'updated_at', direction: 'desc' });

  const finalTaskSortConfig = useMemo(() => {
    if (view === 'tasks-kanban') {
      return { key: 'kanban_order', direction: 'asc' as const };
    }
    return {
      key: sortConfig.key || 'updated_at',
      direction: sortConfig.direction,
    };
  }, [view, sortConfig]);

  const { data: tasksData = [], isLoading: isLoadingTasks, refetch } = useTasks({
    projectIds,
    hideCompleted: hideCompletedTasks,
    sortConfig: finalTaskSortConfig,
    enabled: projectIds !== undefined,
  });

  const { deleteTask, toggleTaskCompletion, isToggling, updateTaskStatusAndOrder } = useTaskMutations(refetch);

  const filteredTasks = useMemo(() => {
    if (!searchTerm) return tasksData;
    const lowercasedFilter = searchTerm.toLowerCase();
    return tasksData.filter(task => 
      task.title.toLowerCase().includes(lowercasedFilter) ||
      (task.description && task.description.toLowerCase().includes(lowercasedFilter)) ||
      (task.project_name && task.project_name.toLowerCase().includes(lowercasedFilter))
    );
  }, [tasksData, searchTerm]);

  const handleEditTask = async (task: Task) => {
    try {
      const projectForTask = await getProjectBySlug(task.project_slug);
      if (!projectForTask) {
        throw new Error("Project for this task could not be found.");
      }
      onOpenTaskModal(task, undefined, projectForTask);
    } catch (error) {
      toast.error("Could not open task editor.", { description: (error as Error).message });
    }
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete, {
        onSuccess: () => {
          setTaskToDelete(null);
        }
      });
    }
  };

  const handleToggleTaskCompletion = (task: Task, completed: boolean) => {
    toggleTaskCompletion({ task, completed });
  };

  const handleTaskStatusChange = (task: Task, newStatus: TaskStatus) => {
    updateTaskStatusAndOrder({
      taskId: task.id,
      newStatus,
      orderedTaskIds: [],
      newTasks: [],
      queryKey: ['tasks'],
      movedColumns: true,
    });
  };

  const handleTaskOrderChange = (payload: UpdateTaskOrderPayload) => {
    updateTaskStatusAndOrder(payload);
  };

  if (isLoadingTasks) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {view === 'tasks' ? (
        <TasksTableView
          tasks={filteredTasks}
          isLoading={isLoadingTasks}
          onEdit={handleEditTask}
          onDelete={setTaskToDelete}
          onToggleTaskCompletion={handleToggleTaskCompletion}
          onStatusChange={handleTaskStatusChange}
          isToggling={isToggling}
          sortConfig={sortConfig}
          requestSort={requestSort}
          rowRefs={rowRefs}
          highlightedTaskId={highlightedTaskId}
          onHighlightComplete={onHighlightComplete}
          unreadTaskIds={unreadTaskIds}
        />
      ) : (
        <TasksKanbanView
          tasks={filteredTasks}
          onEdit={handleEditTask}
          onDelete={setTaskToDelete}
          refetch={refetch}
          tasksQueryKey={['tasks', { projectIds, hideCompletedTasks, sortConfig: finalTaskSortConfig }]}
          onTaskOrderChange={handleTaskOrderChange}
        />
      )}
      <AlertDialog open={!!taskToDelete} onOpenChange={() => setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Task?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. Are you sure you want to delete this task?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectTasksView;