import ListView from './ListView';
import TableView from './TableView';
import KanbanView from './KanbanView';
import TasksView from './TasksView';
import TasksKanbanView from './TasksKanbanView';
import { Project, Task as ProjectTask } from '@/types';

type SortConfig<T> = { key: keyof T | null; direction: 'ascending' | 'descending' };

type ProjectViewContainerProps = {
  view: 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';
  projects: Project[];
  tasks: ProjectTask[];
  isLoading: boolean;
  isTasksLoading: boolean;
  onDeleteProject: (projectId: string) => void;
  sortConfig: SortConfig<Project>;
  requestSort: (key: keyof Project) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
  kanbanGroupBy: 'status' | 'payment_status';
  onEditTask: (task: ProjectTask) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskCompletion: (task: ProjectTask, completed: boolean) => void;
  isToggling: boolean;
  taskSortConfig: { key: string; direction: 'asc' | 'desc' };
  requestTaskSort: (key: string) => void;
  refetch: () => void;
  tasksQueryKey: (string | { projectIds: undefined; hideCompleted: boolean; sortConfig: { key: string; direction: "asc" | "desc"; }; })[];
  highlightedTaskId: string | null;
  onHighlightComplete: () => void;
  unreadProjectIds: Set<string>;
  onProjectClick: (projectId: string, projectSlug: string) => void;
};

const ProjectViewContainer = (props: ProjectViewContainerProps) => {
  const { view, projects, tasks, isLoading, isTasksLoading, onDeleteProject, sortConfig, requestSort, rowRefs, kanbanGroupBy, onEditTask, onDeleteTask, onToggleTaskCompletion, isToggling, taskSortConfig, requestTaskSort, refetch, tasksQueryKey, highlightedTaskId, onHighlightComplete, unreadProjectIds, onProjectClick } = props;

  switch (view) {
    case 'table':
      return <TableView projects={projects} isLoading={isLoading} onDeleteProject={onDeleteProject} sortConfig={sortConfig} requestSort={requestSort} rowRefs={rowRefs} unreadProjectIds={unreadProjectIds} onProjectClick={onProjectClick} />;
    case 'list':
      return <ListView projects={projects} onDeleteProject={onDeleteProject} unreadProjectIds={unreadProjectIds} onProjectClick={onProjectClick} />;
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
        rowRefs={rowRefs}
        highlightedTaskId={highlightedTaskId}
        onHighlightComplete={onHighlightComplete}
      />;
    case 'tasks-kanban':
      return <TasksKanbanView 
        tasks={tasks} 
        isLoading={isTasksLoading} 
        refetch={refetch} 
        tasksQueryKey={tasksQueryKey}
        onEdit={onEditTask}
        onDelete={onDeleteTask}
        highlightedTaskId={highlightedTaskId}
        onHighlightComplete={onHighlightComplete}
      />;
    default:
      return <ListView projects={projects} onDeleteProject={onDeleteProject} unreadProjectIds={unreadProjectIds} onProjectClick={onProjectClick} />;
  }
};

export default ProjectViewContainer;