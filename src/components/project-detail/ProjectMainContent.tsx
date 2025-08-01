import { Project, User, Comment } from "@/data/projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectComments from "@/components/ProjectComments";
import { Card, CardContent } from "@/components/ui/card";
import ProjectOwner from "./ProjectOwner";
import ProjectDescription from "./ProjectDescription";
import ProjectTeam from "./ProjectTeam";
import ProjectServices from "./ProjectServices";
import ProjectAttachments from "./ProjectAttachments";
import ProjectReview from "./ProjectReview";

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (users: User[]) => void;
  onFilesChange: (files: File[]) => void;
  onServicesChange: (services: string[]) => void;
  onAddCommentOrTicket: (comment: Comment) => void;
  allProjects: Project[];
  availableTeamMembers: User[];
  newFiles: File[];
}

const ProjectMainContent = ({
  project,
  isEditing,
  onDescriptionChange,
  onTeamChange,
  onFilesChange,
  onServicesChange,
  onAddCommentOrTicket,
  allProjects,
  availableTeamMembers,
  newFiles,
}: ProjectMainContentProps) => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="comments">Comments</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Card>
          <CardContent className="p-6 space-y-6">
            <ProjectOwner owner={project.createdBy} />
            <ProjectDescription
              description={project.description}
              isEditing={isEditing}
              onDescriptionChange={onDescriptionChange}
            />
            <ProjectTeam
              team={project.assignedTo}
              availableTeamMembers={availableTeamMembers}
              isEditing={isEditing}
              onTeamChange={onTeamChange}
            />
            <ProjectServices
              services={project.services}
              isEditing={isEditing}
              onServicesChange={onServicesChange}
            />
            <ProjectAttachments
              attachments={project.attachments || []}
              newFiles={newFiles}
              isEditing={isEditing}
              onFilesChange={onFilesChange}
            />
            <ProjectReview />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="comments">
        <Card>
          <CardContent className="p-4 md:p-6">
            <ProjectComments
              project={project}
              assignableUsers={project.assignedTo}
              allProjects={allProjects}
              onAddCommentOrTicket={onAddCommentOrTicket}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ProjectMainContent;