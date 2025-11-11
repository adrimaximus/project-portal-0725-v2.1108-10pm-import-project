import React from 'react';
import { Task as ProjectTask, TaskStatus } from '@/types';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskDrawer } from '@/contexts/TaskDrawerContext';
import { getProjectBySlug } from '@/lib/projectsApi';
import { toast } from 'sonner';
import TaskListItem from '@/components/tasks/TaskListItem';

interface TasksViewProps {
  tasks: ProjectTask[];
  isLoading: boolean;
  onEdit: (task: ProjectTask) => void;
  onDelete: (taskId: string) => void;
  onToggleTaskCompletion: (task: ProjectTask, completed: boolean) => void;
  onStatusChange: (task: ProjectTask, newStatus: TaskStatus) => void;
  isToggling: boolean;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  requestSort: (key: string) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  highlightedTaskId: string | null;
  onHighlightComplete: () => void;
  unreadTaskIds: string[];
}

const TasksView = ({ tasks, isLoading, onToggleTaskCompletion, unreadTaskIds = [] }: TasksViewProps) => {
  const { user } = useAuth();
  const { onOpen: onOpenTaskDrawer } = useTaskDrawer();

  const handleTaskClick = async (task: ProjectTask) => {
    try {
      const projectForTask = await getProjectBySlug(task.project_slug);
      if (!projectForTask) {
        throw new Error("Project for this task could not be found.");
      }
      onOpenTaskDrawer(task, projectForTask);
    } catch (error) {
      toast.error("Could not open task details.", { description: (error as Error).message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No tasks found for the current filters.</div>;
  }

  return (
    <div className="divide-y divide-border">
      {tasks.map(task => (
        <TaskListItem
          key={task.id}
          task={task}
          onClick={handleTaskClick}
          onToggleCompletion={onToggleTaskCompletion}
          isUnread={unreadTaskIds.includes(task.id)}
          currentUserId={user?.id}
        />
      ))}
    </div>
  );
};

export default TasksView;