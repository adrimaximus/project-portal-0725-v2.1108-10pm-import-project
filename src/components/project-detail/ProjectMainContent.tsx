import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Project, Comment } from "@/data/projects";
import ProjectComments from "@/components/ProjectComments";
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
}: ProjectMainContentProps) => {
  const handleCommentPost = (newComment: Comment) => {
    setComments((prevComments) => [...prevComments, newComment]);
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="comments">
          Comments
          {project.comments && project.comments.length > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
              {project.comments.length}
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
          projectId={projectId}
          comments={comments}
          onCommentPost={handleCommentPost}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectMainContent;