import React from 'react';
import { Project, Task as ProjectTask, TaskStatus, ProjectStatus } from '@/types';
import TableView from './TableView';
import ListView from './ListView';
import KanbanView from './KanbanView';
import TasksView from './TasksView';
import TasksKanbanView from './TasksKanbanView';

interface ProjectViewContainerProps {
  view: ViewMode;
  projects: Project[];
  tasks: ProjectTask[];
  isLoading: boolean;
  isTasksLoading: boolean;
  onDeleteProject: (projectId: string) => void;
  sortConfig: { key: keyof Project | null; direction: 'ascending' | 'descending' };
  requestSort: (key: keyof Project) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  kanbanGroupBy: 'status' | 'payment_status';
  onEditTask: (task: ProjectTask) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskCompletion: (task: ProjectTask, completed: boolean) => void;
  onTaskStatusChange: (task: ProjectTask, newStatus: TaskStatus) => void;
  isToggling: boolean;
  taskSortConfig: { key: string; direction: 'asc' | 'desc' };
  requestTaskSort: (key: string) => void;
  refetch: () => void;
  tasksQueryKey: any[];
  highlightedTaskId: string | null;
  onHighlightComplete: () => void;
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
  onTaskOrderChange: (payload: { taskId: string; newStatus: TaskStatus; orderedTaskIds: string[]; newTasks: ProjectTask[]; queryKey: any[]; movedColumns: boolean }) => void;
}

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

const ProjectViewContainer = ({
  view, projects, tasks, isLoading, isTasksLoading, onDeleteProject, sortConfig, requestSort, rowRefs,
  kanbanGroupBy, onEditTask, onDeleteTask, onToggleTaskCompletion, onTaskStatusChange, isToggling,
  taskSortConfig, requestTaskSort, refetch, tasksQueryKey, highlightedTaskId, onHighlightComplete, onStatusChange,
  onTaskOrderChange
}: ProjectViewContainerProps) => {
  switch (view) {
    case 'table':
      return <TableView projects={projects} isLoading={isLoading} onDeleteProject={onDeleteProject} sortConfig={sortConfig} requestSort={requestSort} rowRefs={rowRefs} onStatusChange={onStatusChange} />;
    case 'list':
      return <ListView projects={projects} onDeleteProject={onDeleteProject} />;
    case 'kanban':
      return <KanbanView projects={projects} groupBy={kanbanGroupBy} />;
    case 'tasks':
      return <TasksView 
        tasks={tasks} 
        isLoading={isTasksLoading} 
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        onToggleTaskCompletion={onToggleTaskCompletion}
        onStatusChange={onTaskStatusChange}
        isToggling={isToggling}
        sortConfig={taskSortConfig}
        requestSort={requestTaskSort}
        rowRefs={rowRefs}
        highlightedTaskId={highlightedTaskId}
        onHighlightComplete={onHighlightComplete}
      />;
    case 'tasks-kanban':
      return <TasksKanbanView 
        tasks={tasks} 
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        refetch={refetch}
        tasksQueryKey={tasksQueryKey}
        onTaskOrderChange={onTaskOrderChange}
      />;
    default:
      return null;
  }
};

export default ProjectViewContainer;