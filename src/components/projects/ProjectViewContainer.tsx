import { Project } from "@/types";
import TableView from "./TableView";
import ListView from "./ListView";
import KanbanView from "./KanbanView";
import TasksView from "./TasksView";
import TasksKanbanView from "./TasksKanbanView";
import { Task, TaskStatus } from "@/types/task";

interface ProjectViewContainerProps {
  view: 'table' | 'list' | 'kanban' | 'tasks' | 'tasks-kanban';
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
  taskSortConfig: { key: string; direction: 'asc' | 'desc' };
  requestTaskSort: (key: string) => void;
  onTaskStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

const ProjectViewContainer = ({
  view,
  projects,
  tasks,
  isLoading,
  isTasksLoading,
  onDeleteProject,
  sortConfig,
  requestSort,
  rowRefs,
  kanbanGroupBy,
  onEditTask,
  onDeleteTask,
  onToggleTaskCompletion,
  taskSortConfig,
  requestTaskSort,
  onTaskStatusChange,
}: ProjectViewContainerProps) => {
  switch (view) {
    case 'table':
      return (
        <TableView
          projects={projects}
          isLoading={isLoading}
          onDeleteProject={onDeleteProject}
          sortConfig={sortConfig}
          requestSort={requestSort}
          rowRefs={rowRefs}
        />
      );
    case 'list':
      return <ListView projects={projects} isLoading={isLoading} onDeleteProject={onDeleteProject} />;
    case 'kanban':
      return (
        <KanbanView
          projects={projects}
          isLoading={isLoading}
          groupBy={kanbanGroupBy}
        />
      );
    case 'tasks':
      return (
        <TasksView
          tasks={tasks}
          isLoading={isTasksLoading}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onToggleCompletion={onToggleTaskCompletion}
          sortConfig={taskSortConfig}
          requestSort={requestTaskSort}
        />
      );
    case 'tasks-kanban':
      return (
        <TasksKanbanView
          tasks={tasks}
          isLoading={isTasksLoading}
          onEditTask={onEditTask}
          onDeleteTask={onDeleteTask}
          onStatusChange={onTaskStatusChange}
        />
      );
    default:
      return null;
  }
};

export default ProjectViewContainer;