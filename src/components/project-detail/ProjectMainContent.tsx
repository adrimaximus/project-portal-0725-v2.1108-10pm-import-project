import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project } from "@/data/projects";
import { Comment } from "../ProjectComments";
import ProjectDescription from "./ProjectDescription";
import ProjectTeam from "./ProjectTeam";
import ProjectBrief from "./ProjectBrief";
import ProjectComments from "../ProjectComments";

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (selectedUsers: Project['assignedTo']) => void;
  onFilesChange: (files: File[]) => void;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  projectId: string;
  ticketCount: number;
  allProjects?: Project[];
}

const ProjectMainContent = ({
  project,
  isEditing,
  onDescriptionChange,
  onTeamChange,
  onFilesChange,
  comments,
  setComments,
  projectId,
  ticketCount,
  allProjects = [],
}: ProjectMainContentProps) => {
  return (
    <Tabs defaultValue="description">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="brief">Brief</TabsTrigger>
        <TabsTrigger value="comments">
          Comments
          {ticketCount > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
              {ticketCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="description">
        <ProjectDescription
          description={project.description}
          isEditing={isEditing}
          onDescriptionChange={onDescriptionChange}
        />
      </TabsContent>
      <TabsContent value="team">
        <ProjectTeam
          assignedTo={project.assignedTo}
          isEditing={isEditing}
          onTeamChange={onTeamChange}
        />
      </TabsContent>
      <TabsContent value="brief">
        <ProjectBrief
          files={project.briefFiles || []}
          isEditing={isEditing}
          onFilesChange={onFilesChange}
        />
      </TabsContent>
      <TabsContent value="comments">
        <ProjectComments
          comments={comments}
          setComments={setComments}
          projectId={projectId}
          assignableUsers={project.assignedTo}
          allProjects={allProjects}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectMainContent;