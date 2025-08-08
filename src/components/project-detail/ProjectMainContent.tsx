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
  onUpdateTasks: (tasks: Task[]) => void;
  onTaskStatusChange: (taskId: string, completed: boolean) => void;
  onTaskDelete: (taskId: string) => void;
  onAddCommentOrTicket: (comment: Comment) => void;
}

const ProjectMainContent = ({
  project,
  onUpdateTasks,
  onTaskStatusChange,
  onTaskDelete,
  onAddCommentOrTicket,
}: ProjectMainContentProps) => {
  const openTasksCount = project.tasks?.filter(task => !task.completed).length || 0;
  const ticketCount = project.comments?.filter(c => c.isTicket).length || 0;

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="overview">
              <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline ml-2">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ListChecks className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline ml-2">Tasks</span>
              {openTasksCount > 0 && <Badge className="ml-2">{openTasksCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="discussion">
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline ml-2">Discussion</span>
              {ticketCount > 0 && <Badge className="ml-2 bg-orange-500">{ticketCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="activity">
              <History className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline ml-2">Activity</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <ProjectOverviewTab
              project={project}
              isEditing={false} // Placeholder
              onDescriptionChange={() => {}}
              onTeamChange={() => {}}
              onFilesChange={() => {}}
              onServicesChange={() => {}}
            />
          </TabsContent>
          <TabsContent value="tasks">
            <ProjectTasks
              project={project}
              onUpdateTasks={onUpdateTasks}
              onTaskStatusChange={onTaskStatusChange}
              onTaskDelete={onTaskDelete}
            />
          </TabsContent>
          <TabsContent value="discussion">
            <ProjectComments
              project={project}
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