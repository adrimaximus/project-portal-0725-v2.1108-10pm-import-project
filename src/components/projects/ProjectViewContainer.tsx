import { Project, Task } from '@/types';
import TableView from './TableView';
import ListView from './ListView';
import KanbanView from './KanbanView';
import TasksView from './TasksView';
import { MutableRefObject } from 'react';

interface ProjectViewContainerProps {
  view: 'table' | 'list' | 'kanban' | 'tasks';
  projects: Project[];
  tasks: Task[];
  isLoading: boolean;
  isTasksLoading: boolean;
  onDeleteProject: (projectId: string) => void;
}

const ProjectViewContainer = ({
  view,
  projects,
  tasks,
  isLoading,
  isTasksLoading,
  onDeleteProject,
}: ProjectViewContainerProps) => {
  switch (view) {
    case 'table':
      return <TableView projects={projects} />;
    case 'list':
      return <ListView projects={projects} isLoading={isLoading} onDeleteProject={onDeleteProject} />;
    case 'kanban':
      return <KanbanView projects={projects} isLoading={isLoading} />;
    case 'tasks':
      return <TasksView tasks={tasks} projects={projects} isLoading={isTasksLoading} />;
    default:
      return null;
  }
};

export default ProjectViewContainer;