import { Project, AssignedUser } from "@/types";
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
  onTaskAdd: (title: string) => void;
  onTaskAssignUsers: (taskId: string, userIds: string[]) => void;
  onTaskStatusChange: (taskId: string, completed: boolean) => void;
  onTaskDelete: (taskId: string) => void;
  onAddCommentOrTicket: (text: string, isTicket: boolean, attachment: File | null) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTeamChange: (users: AssignedUser[]) => void;
  onFilesAdd: (files: File[]) => void;
  onFileDelete: (fileId: string) => void;
  onServicesChange: (services: string[]) => void;
}

const ProjectMainContent = ({
  project,
  isEditing,
  onTaskAdd,
  onTaskAssignUsers,
  onTaskStatusChange,
  onTaskDelete,
  onAddCommentOrTicket,
  onDescriptionChange,
  onCategoryChange,
  onTeamChange,
  onFilesAdd,
  onFileDelete,
  onServicesChange,
}: ProjectMainContentProps) => {
  const openTasksCount = project.tasks?.filter(task => !task.completed).length || 0;

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
            </TabsTrigger>
            <TabsTrigger value="activity">
              <History className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline ml-2">Activity</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <ProjectOverviewTab
              project={project}
              isEditing={isEditing}
              onDescriptionChange={onDescriptionChange}
              onCategoryChange={onCategoryChange}
              onTeamChange={onTeamChange}
              onFilesAdd={onFilesAdd}
              onFileDelete={onFileDelete}
              onServicesChange={onServicesChange}
            />
          </TabsContent>
          <TabsContent value="tasks">
            <ProjectTasks
              project={project}
              onTaskAdd={onTaskAdd}
              onTaskAssignUsers={onTaskAssignUsers}
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