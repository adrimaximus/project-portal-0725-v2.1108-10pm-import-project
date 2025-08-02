import { Project, AssignedUser, Comment, Task } from "@/data/projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectComments from "@/components/ProjectComments";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ProjectOverviewTab from "./ProjectOverviewTab";
import ProjectActivityFeed from "./ProjectActivityFeed";
import ProjectTasks from "./ProjectTasks";

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (users: AssignedUser[]) => void;
  onFilesChange: (files: File[]) => void;
  onServicesChange: (services: string[]) => void;
  onAddCommentOrTicket: (comment: Comment) => void;
  onTasksUpdate: (tasks: Task[]) => void;
  ticketCount: number;
  allProjects: Project[];
}

const ProjectMainContent = ({
  project,
  isEditing,
  onDescriptionChange,
  onTeamChange,
  onFilesChange,
  onServicesChange,
  onAddCommentOrTicket,
  onTasksUpdate,
  ticketCount,
  allProjects,
}: ProjectMainContentProps) => {
  const totalTasks = project.tasks?.length || 0;

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">
              Tasks
              {totalTasks > 0 && <Badge className="ml-2">{totalTasks}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="comments">
              Comments & Tickets
              {ticketCount > 0 && <Badge className="ml-2 bg-orange-500">{ticketCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <ProjectOverviewTab
              project={project}
              isEditing={isEditing}
              onDescriptionChange={onDescriptionChange}
              onTeamChange={onTeamChange}
              onFilesChange={onFilesChange}
              onServicesChange={onServicesChange}
            />
          </TabsContent>
          <TabsContent value="tasks">
            <ProjectTasks
              tasks={project.tasks || []}
              assignableUsers={project.assignedTo}
              onTasksUpdate={onTasksUpdate}
            />
          </TabsContent>
          <TabsContent value="comments">
            <ProjectComments
              project={project}
              assignableUsers={project.assignedTo}
              allProjects={allProjects}
              onAddCommentOrTicket={onAddCommentOrTicket}
            />
          </TabsContent>
          <TabsContent value="activity">
            <ProjectActivityFeed activities={project.activities || []} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProjectMainContent;