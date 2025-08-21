import { Project, AssignedUser, Task, Tag } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectComments from "@/components/ProjectComments";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ProjectOverviewTab from "./ProjectOverviewTab";
import ProjectActivityFeed from "./ProjectActivityFeed";
import ProjectTasks from "./ProjectTasks";
import { LayoutDashboard, ListChecks, MessageSquare, History } from "lucide-react";
import { useProjectContext } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";

const ProjectMainContent = () => {
  const { editedProject, isEditing, handleFieldChange, mutations } = useProjectContext();
  const { user } = useAuth();

  const openTasksCount = editedProject.tasks?.filter(task => !task.completed).length || 0;

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
              project={editedProject}
              isEditing={isEditing}
              onDescriptionChange={(value) => handleFieldChange('description', value)}
              onTeamChange={(users) => handleFieldChange('assignedTo', users)}
              onFilesAdd={(files) => mutations.addFiles.mutate({ files, project: editedProject, user: user! })}
              onFileDelete={(fileId) => {
                const file = editedProject.briefFiles?.find(f => f.id === fileId);
                if (file) mutations.deleteFile.mutate(file);
              }}
              onServicesChange={(services) => handleFieldChange('services', services)}
              onTagsChange={(tags: Tag[]) => handleFieldChange('tags', tags)}
            />
          </TabsContent>
          <TabsContent value="tasks">
            <ProjectTasks
              project={editedProject}
              onTaskAdd={(title) => mutations.addTask.mutate({ project: editedProject, user: user!, title })}
              onTaskAssignUsers={(taskId, userIds) => mutations.assignUsersToTask.mutate({ taskId, userIds })}
              onTaskStatusChange={(taskId, completed) => mutations.updateTask.mutate({ taskId, updates: { completed } })}
              onTaskDelete={(taskId) => mutations.deleteTask.mutate(taskId)}
            />
          </TabsContent>
          <TabsContent value="discussion">
            <ProjectComments
              project={editedProject}
              onAddCommentOrTicket={(text, isTicket, attachment) => mutations.addComment.mutate({ project: editedProject, user: user!, text, isTicket, attachment })}
            />
          </TabsContent>
          <TabsContent value="activity">
            <ProjectActivityFeed activities={editedProject.activities || []} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProjectMainContent;