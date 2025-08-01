import { Project, User, Comment } from "@/data/projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectComments from "@/components/ProjectComments";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ProjectOwnerInfo from "./ProjectOwnerInfo";
import ProjectStatusBadge from "./ProjectStatusBadge";

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (users: User[]) => void;
  onFilesChange: (files: File[]) => void;
  onServicesChange: (services: string[]) => void;
  onAddCommentOrTicket: (comment: Comment) => void;
  projectId: string;
  ticketCount: number;
  allProjects: Project[];
}

const ProjectMainContent = ({
  project,
  onAddCommentOrTicket,
  ticketCount,
  allProjects,
}: ProjectMainContentProps) => {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comments">
              Comments & Tickets
              {ticketCount > 0 && <Badge className="ml-2 bg-orange-500">{ticketCount}</Badge>}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="space-y-8">
              <div className="flex justify-between items-start">
                <ProjectOwnerInfo owner={project.createdBy} />
                <ProjectStatusBadge startDate={project.startDate} endDate={project.endDate} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p>{project.description || "No description provided."}</p>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="comments">
            <ProjectComments
              project={project}
              assignableUsers={project.assignedTo}
              allProjects={allProjects}
              onAddCommentOrTicket={onAddCommentOrTicket}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProjectMainContent;