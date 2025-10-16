import React from 'react';
import { Project } from '@/types';
import { Task } from '@/types';
import TableView from './TableView';
import ListView from './ListView';
import KanbanView from './KanbanView';
import TasksView from './TasksView';
import TasksKanbanView from './TasksKanbanView';

type ViewMode = 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';

interface ProjectViewContainerProps {
  view: ViewMode;
  projects: Project[];
  tasks: Task[];
  isLoading: boolean;
  isTasksLoading: boolean;
  onDeleteProject: (projectId: string) => void;
  sortConfig: { key: keyof Project | null; direction: 'ascending' | 'descending' };
  requestSort: (key: keyof Project) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  kanbanGroupBy: 'status' | 'payment_status';
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskCompletion: (task: Task, completed: boolean) => void;
  isToggling: boolean;
  taskSortConfig: { key: string; direction: 'asc' | 'desc' };
  requestTaskSort: (key: string) => void;
  onTaskStatusChange: (taskId: string, newStatus: any) => void;
  onToggleTaskReaction: (variables: { taskId: string, emoji: string }) => void;
}

const ProjectViewContainer = ({
  view, projects, tasks, isLoading, isTasksLoading, onDeleteProject, sortConfig, requestSort, rowRefs,
  kanbanGroupBy, onEditTask, onDeleteTask, onToggleTaskCompletion, isToggling,
  taskSortConfig, requestTaskSort, onTaskStatusChange, onToggleTaskReaction
}: ProjectViewContainerProps) => {
  switch (view) {
    case 'table':
      return <TableView projects={projects} isLoading={isLoading} onDeleteProject={onDeleteProject} sortConfig={sortConfig} requestSort={requestSort} rowRefs={rowRefs} />;
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
        isToggling={isToggling}
        sortConfig={taskSortConfig}
        requestSort={requestTaskSort}
      />;
    case 'tasks-kanban':
      return <TasksKanbanView 
        tasks={tasks} 
        onStatusChange={onTaskStatusChange} 
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        onToggleTaskReaction={onToggleTaskReaction}
      />;
    default:
      return null;
  }
};

export default ProjectViewContainer;