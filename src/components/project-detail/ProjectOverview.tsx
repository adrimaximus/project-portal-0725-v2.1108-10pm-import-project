import { Project, AssignedUser, Task } from "@/data/projects";
import ProjectDescription from "./ProjectDescription";
import ProjectTeam from "./ProjectTeam";
import ProjectBrief from "./ProjectBrief";
import ProjectProgressCard from "./ProjectProgressCard";

interface ProjectOverviewProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
  onFilesChange: (files: File[]) => void;
  onTasksUpdate: (tasks: Task[]) => void;
}

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-3">
    <h4 className="font-semibold">{title}</h4>
    <div className="text-sm text-muted-foreground">{children}</div>
  </div>
);

const ProjectOverview = ({
  project,
  isEditing,
  onDescriptionChange,
  onTeamChange,
  onFilesChange,
  onTasksUpdate,
}: ProjectOverviewProps) => {
  return (
    <div className="space-y-8">
      <Section title="Description">
        <ProjectDescription
          description={project.description}
          isEditing={isEditing}
          onDescriptionChange={onDescriptionChange}
        />
      </Section>

      <Section title="Assigned Team">
        <ProjectTeam
          assignedTo={project.assignedTo}
          onTeamChange={onTeamChange}
        />
      </Section>

      <Section title="Attachments">
        <ProjectBrief
          files={project.briefFiles || []}
          isEditing={isEditing}
          onFilesChange={onFilesChange}
        />
      </Section>

      <ProjectProgressCard project={project} onTasksUpdate={onTasksUpdate} />
    </div>
  );
};

export default ProjectOverview;