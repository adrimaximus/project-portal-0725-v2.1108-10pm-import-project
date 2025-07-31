import { Project, User, ProjectFile } from "@/data/projects";
import ProjectDescription from "./ProjectDescription";
import ProjectTeam from "./ProjectTeam";
import ProjectFiles from "./ProjectFiles";
import ProjectServices from "./ProjectServices";
import ProjectComments from "../ProjectComments";
import { Comment } from "@/data/comments";

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (selectedUsers: User[]) => void;
  onFilesChange: (files: File[]) => void;
  onServicesChange: (services: string[]) => void;
  onAddCommentOrTicket: (comment: Comment) => void;
  projectId: string;
  ticketCount: number;
  allProjects: Project[];
}

const ProjectMainContent = (props: ProjectMainContentProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <ProjectDescription
          description={props.project.description}
          isEditing={props.isEditing}
          onDescriptionChange={props.onDescriptionChange}
        />
        <ProjectComments
          project={props.project}
          onAddComment={props.onAddCommentOrTicket}
          allProjects={props.allProjects}
        />
      </div>
      <div className="space-y-6">
        <ProjectTeam
          assignedTo={props.project.assignedTo}
          createdBy={props.project.createdBy}
          isEditing={props.isEditing}
          onTeamChange={props.onTeamChange}
        />
        <ProjectFiles project={props.project} />
        <ProjectServices
          selectedServices={props.project.services}
          isEditing={props.isEditing}
          onServicesChange={props.onServicesChange}
        />
      </div>
    </div>
  );
};

export default ProjectMainContent;