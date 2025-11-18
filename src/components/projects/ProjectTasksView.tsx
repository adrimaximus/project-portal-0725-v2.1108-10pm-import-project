import { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, Task as ProjectTask, UpsertTaskPayload, TaskStatus } from '@/types';
import { toast } from 'sonner';
import { useTaskModal } from '@/contexts/TaskModalContext';
import { useUnreadTasks } from '@/hooks/useUnreadTasks';
import { useSortConfig } from '@/hooks/useSortConfig';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import TasksTableView from './TasksTableView';
import TasksKanbanView from './TasksKanbanView';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getErrorMessage } from '@/lib/utils';
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
  const queryClient = useQueryClient();
  const { onOpen: onOpenTaskModal } = useTaskModal();
  const { unreadTaskIds } = useUnreadTasks();
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const [taskToDelete, setTaskToDelete] = useState<ProjectTask | null>(null);

  const { sortConfig, requestSort, sortedData: sortedTasks } = useSortConfig<ProjectTask>([], { key: 'updated_at', direction: 'desc' });

  const { data: tasks = [], isLoading: isLoadingTasks, error: tasksError } = useQuery({
    queryKey: ['tasks', { projectIds, hideCompleted: hideCompletedTasks, sortConfig }],
    queryFn: async () => {
      if (projectIds === undefined) {
        return []; // Don't fetch if projectIds are not ready
      }
      const { data, error } = await supabase.rpc('get_project_tasks', {
        p_project_ids: projectIds.length > 0 ? projectIds : null,
        p_completed: hideCompletedTasks ? false : null,
        p_order_by: sortConfig.key || 'updated_at',
        p_order_direction: sortConfig.direction,
        p_limit: 1000,
        p_offset: 0,
        p_search_term: searchTerm || null,
      });
      if (error) throw error;
      return (data as ProjectTask[]) || [];
    },
    enabled: projectIds !== undefined, // Only run query when projectIds are available
  });

  const { deleteTask, toggleTaskCompletion, updateTaskStatus, isTogglingTask } = useTaskMutations(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['project'] });
  });

  const filteredTasks = useMemo(() => {
    if (!searchTerm) return tasks;
    return tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  const handleDeleteTask = (task: ProjectTask) => {
    setTaskToDelete(task);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id, {
        onSuccess: () => {
          toast.success(`Task "${taskToDelete.title}" deleted.`);
          setTaskToDelete(null);
        },
        onError: (error) => {
          toast.error(`Failed to delete task.`, { description: getErrorMessage(error) });
        }
      });
    }
  };

  const handleToggleTaskCompletion = (task: ProjectTask, completed: boolean) => {
    toggleTaskCompletion({ taskId: task.id, completed });
  };

  const handleStatusChange = (task: ProjectTask, newStatus: TaskStatus) => {
    updateTaskStatus({ taskId: task.id, status: newStatus });
  };

  const handleEditTask = (task: ProjectTask) => {
    onOpenTaskModal(task);
  };

  if (projectIds === undefined) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the task "{taskToDelete?.title}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {view === 'tasks' ? (
        <TasksTableView
          tasks={filteredTasks}
          isLoading={isLoadingTasks}
          onEdit={handleEditTask}
          onDelete={(taskId) => {
            const task = tasks.find(t => t.id === taskId);
            if (task) handleDeleteTask(task);
          }}
          onToggleTaskCompletion={handleToggleTaskCompletion}
          onStatusChange={handleStatusChange}
          isToggling={isTogglingTask}
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
          isLoading={isLoadingTasks}
          onEditTask={handleEditTask}
          onDeleteTask={(taskId) => {
            const task = tasks.find(t => t.id === taskId);
            if (task) handleDeleteTask(task);
          }}
          onToggleTaskCompletion={handleToggleTaskCompletion}
          onStatusChange={handleStatusChange}
          highlightedTaskId={highlightedTaskId}
          onHighlightComplete={onHighlightComplete}
          unreadTaskIds={unreadTaskIds}
        />
      )}
    </>
  );
};

export default ProjectTasksView;