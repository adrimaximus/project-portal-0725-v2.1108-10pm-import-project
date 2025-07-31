import { Project, Task, User } from "@/data/projects";
import { ProjectComments } from "../ProjectComments";
import { ProjectProgressCard } from "./ProjectProgressCard";
import { ProjectTasks } from "./ProjectTasks";

interface ProjectMainContentProps {
  project: Project;
  onAddTask: (taskTitle: string) => void;
  onToggleTask: (taskId: string) => void;
  onAssignUserToTask: (taskId: string, user: User) => void;
}

export function ProjectMainContent({
  project,
  onAddTask,
  onToggleTask,
  onAssignUserToTask,
}: ProjectMainContentProps) {
  const completedTasks = project.tasks.filter((task) => task.completed).length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="lg:col-span-2 space-y-6">
      <ProjectProgressCard
        progress={progress}
        tasks={project.tasks}
        team={project.assignedTo}
        projectCreator={project.createdBy}
      />
      <ProjectTasks
        tasks={project.tasks}
        team={project.assignedTo}
        onAddTask={onAddTask}
        onToggleTask={onToggleTask}
        onAssignUserToTask={onAssignUserToTask}
      />
      <ProjectComments project={project} />
    </div>
  );
}