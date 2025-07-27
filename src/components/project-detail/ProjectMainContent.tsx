import { Project, AssignedUser } from "@/data/projects";
import ProjectDescription from "./ProjectDescription";
import ProjectTeam from "./ProjectTeam";
import ProjectBrief from "./ProjectBrief";
import ProjectComments, { Comment } from "../ProjectComments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "../ui/badge";

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
  onFilesChange: (files: File[]) => void;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  projectId: string;
  ticketCount: number;
  taggableUsers?: AssignedUser[];
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
  taggableUsers = [],
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
            <Badge variant="destructive" className="ml-2">{ticketCount}</Badge>
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
          taggableUsers={taggableUsers}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectMainContent;