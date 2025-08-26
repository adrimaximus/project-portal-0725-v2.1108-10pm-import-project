import React from 'react';
import { Project } from '@/types';
import TableView from './TableView';
import ListView from './ListView';
import KanbanView from './KanbanView';
import CalendarImportView from './CalendarImportView';

type ViewMode = 'table' | 'list' | 'kanban' | 'calendar';

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
  isLoading: boolean;
  onDeleteProject: (projectId: string) => void;
  sortConfig: { key: keyof Project | null; direction: 'ascending' | 'descending' };
  requestSort: (key: keyof Project) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  kanbanGroupBy: 'status' | 'payment_status';
  importableEvents: CalendarEvent[];
  onImportEvent: (event: CalendarEvent) => void;
}

const ProjectViewContainer = ({
  view, projects, isLoading, onDeleteProject, sortConfig, requestSort, rowRefs,
  kanbanGroupBy, importableEvents, onImportEvent
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
    default:
      return null;
  }
};

export default ProjectViewContainer;