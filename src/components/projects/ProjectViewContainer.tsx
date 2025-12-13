import React from 'react';
import { Project, Task as ProjectTask, TaskStatus, ProjectStatus, PaymentStatus } from '@/types';
import TableView from './TableView';
import ListView from './ListView';
import KanbanView from './KanbanView';
import ProjectsEmptyState from './ProjectsEmptyState';

interface ProjectViewContainerProps {
  view: 'table' | 'list' | 'kanban';
  projects: Project[];
  isLoading: boolean;
  onDeleteProject: (projectId: string) => void;
  sortConfig: { key: keyof Project | null; direction: 'asc' | 'desc' };
  requestSort: (key: keyof Project) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  kanbanGroupBy: 'status' | 'payment_status';
  onStatusChange: (projectId: string, newStatus: ProjectStatus) => void;
  onPaymentStatusChange: (projectId: string, newStatus: PaymentStatus) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  searchTerm: string;
}

const ProjectViewContainer = ({
  view, projects, isLoading, onDeleteProject, sortConfig, requestSort, rowRefs,
  kanbanGroupBy, onStatusChange, onPaymentStatusChange, hasActiveFilters, onClearFilters, searchTerm
}: ProjectViewContainerProps) => {

  if (!isLoading && projects.length === 0) {
    return <ProjectsEmptyState hasActiveFilters={hasActiveFilters} onClearFilters={onClearFilters} searchTerm={searchTerm} />;
  }

  switch (view) {
    case 'table':
      return <TableView projects={projects} isLoading={isLoading} onDeleteProject={onDeleteProject} sortConfig={sortConfig} requestSort={requestSort} rowRefs={rowRefs} onStatusChange={onStatusChange} onPaymentStatusChange={onPaymentStatusChange} />;
    case 'list':
      return <ListView projects={projects} onDeleteProject={onDeleteProject} />;
    case 'kanban':
      return <KanbanView projects={projects} groupBy={kanbanGroupBy} />;
    default:
      return null;
  }
};

export default ProjectViewContainer;