import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Project } from "@/data/projects";
import { Comment } from "../ProjectComments";
import ProjectComments from "../ProjectComments";
import ProjectOverviewTab from "./ProjectOverviewTab";

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
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="comments">
          Comments
          {ticketCount > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
              {ticketCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Card>
          <CardContent className="pt-6">
            <ProjectOverviewTab
              project={project}
              isEditing={isEditing}
              onDescriptionChange={onDescriptionChange}
              onTeamChange={onTeamChange}
              onFilesChange={onFilesChange}
            />
          </CardContent>
        </Card>
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