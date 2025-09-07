import { Project, User } from '@/types';
import ProjectTasks from './ProjectTasks';

// This is a mock component structure based on the error.
// The actual file might be different.

interface ProjectMainContentProps {
  project: Project & { tasks: any[] };
  user: User | null;
  mutations: any;
}

const ProjectMainContent = ({ project, user, mutations }: ProjectMainContentProps) => {
  return (
    <div>
      {/* Other content */}
      <ProjectTasks
        tasks={project.tasks}
        projectId={project.id}
        // The following props are assumed based on the error snippet
        onTaskAdd={(title: any) => mutations.addTask.mutate({ project: project, user: user!, title })}
        onTaskAssignUsers={(taskId: any, userIds: any) => { /* logic */ }}
        onTaskStatusChange={(taskId: any, completed: any) => { /* logic */ }}
        onTaskDelete={(taskId: any) => { /* logic */ }}
      />
    </div>
  );
};

export default ProjectMainContent;