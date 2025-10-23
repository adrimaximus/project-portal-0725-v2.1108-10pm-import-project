import { Project } from '@/types';
import KanbanView from './KanbanView';

const ProjectsKanbanView = ({ projects, isLoading, groupBy }: { projects: Project[], isLoading: boolean, groupBy: 'status' | 'payment_status' }) => {
  if (isLoading) {
    return <div>Loading...</div>;
  }
  return <KanbanView projects={projects} groupBy={groupBy} />;
};

export default ProjectsKanbanView;