import { Project } from '@/types';
import KanbanView from './KanbanView';

const ProjectsKanbanView = ({ initialProjects, isLoading, groupBy }: { initialProjects: Project[], isLoading: boolean, groupBy: 'status' | 'payment_status' }) => {
  if (isLoading) {
    return <div>Loading...</div>;
  }
  return <KanbanView projects={initialProjects} groupBy={groupBy} />;
};

export default ProjectsKanbanView;