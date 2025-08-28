import React from 'react';
import { Project } from '@/types';
import { Task } from '@/types/task';
import TableView from './TableView';
import ListView from './ListView';
import KanbanView from './KanbanView';
import CalendarImportView from './CalendarImportView';
import TasksView from './TasksView';

type ViewMode = 'table' | 'list' | 'kanban' | 'calendar' | 'tasks';

interface CalendarEvent {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string; };
    end: { dateTime?: string; date?: string; };
    htmlLink: string;
    status: string;
    location?: string;
    description?: string;
}

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
  importableEvents: CalendarEvent[];
  onImportEvent: (event: CalendarEvent) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskCompletion: (task: Task, completed: boolean) => void;
  taskSortConfig: { key: string; direction: 'asc' | 'desc' };
  requestTaskSort: (key: string) => void;
}

const ProjectViewContainer = ({
  view, projects, tasks, isLoading, isTasksLoading, onDeleteProject, sortConfig, requestSort, rowRefs,
  kanbanGroupBy, importableEvents, onImportEvent, onEditTask, onDeleteTask, onToggleTaskCompletion,
  taskSortConfig, requestTaskSort
}: ProjectViewContainerProps) => {
  switch (view) {
    case 'table':
      return <TableView projects={projects} isLoading={isLoading} onDeleteProject={onDeleteProject} sortConfig={sortConfig} requestSort={requestSort} rowRefs={rowRefs} />;
    case 'list':
      return <ListView projects={projects} onDeleteProject={onDeleteProject} />;
    case 'kanban':
      return <KanbanView projects={projects} groupBy={kanbanGroupBy} />;
    case 'calendar':
      return <CalendarImportView events={importableEvents} onImportEvent={onImportEvent} />;
    case 'tasks':
      return <TasksView 
        tasks={tasks} 
        isLoading={isTasksLoading} 
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        onToggleTaskCompletion={onToggleTaskCompletion}
        sortConfig={taskSortConfig}
        requestSort={requestTaskSort}
      />;
    default:
      return null;
  }
};

export default ProjectViewContainer;