import { Project, AssignedUser } from "@/data/projects";
import { Comment } from "@/data/comments";
import ProjectComments from "../ProjectComments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ProjectMainContentProps {
  project: Project;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  isEditing: boolean;
  editedProject: Project | null;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (users: AssignedUser[]) => void;
  onFilesChange: (files: File[]) => void;
}

const ProjectMainContent = ({ project, comments, setComments }: ProjectMainContentProps) => {
  const ticketCount = comments.filter(c => c.isTicket).length;

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="comments">
          Comments & Tickets
          {ticketCount > 0 && (
            <Badge variant="secondary" className="ml-2">{ticketCount}</Badge>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="comments">
        <ProjectComments
          comments={comments}
          setComments={setComments}
          projectId={project.id}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectMainContent;