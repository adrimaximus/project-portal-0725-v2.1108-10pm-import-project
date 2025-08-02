import { Project, AssignedUser, Comment, Task } from "@/data/projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectComments from "@/components/ProjectComments";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ProjectOverviewTab from "./ProjectOverviewTab";
import ProjectActivityFeed from "./ProjectActivityFeed";
import ProjectTasks from "./ProjectTasks";
import { LayoutDashboard, ListChecks, MessageSquare, History } from "lucide-react";

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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
            <TabsTrigger value="overview">
              <LayoutDashboard className="mr-0 sm:mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ListChecks className="mr-0 sm:mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Tasks</span>
              {totalTasks > 0 && <Badge className="ml-2">{totalTasks}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="mr-0 sm:mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline">Comments & Tickets</span>
              <span className="hidden sm:inline md:hidden">Comments</span>
              {ticketCount > 0 && <Badge className="ml-2 bg-orange-500">{ticketCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="activity">
              <History className="mr-0 sm:mr-2 h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
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