import { Project, Tag } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectComments from "@/components/ProjectComments";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import ProjectOverviewTab from "./ProjectOverviewTab";
import ProjectActivityFeed from "./ProjectActivityFeed";
import ProjectTasks from "./ProjectTasks";
import { LayoutDashboard, ListChecks, MessageSquare, History } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjectMutations } from "@/hooks/useProjectMutations";

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
  mutations: ReturnType<typeof useProjectMutations>;
}

const ProjectMainContent = ({ project, isEditing, onFieldChange, mutations }: ProjectMainContentProps) => {
  const { user } = useAuth();

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
              onDescriptionChange={(value) => onFieldChange('description', value)}
              onTeamChange={(users) => onFieldChange('assignedTo', users)}
              onFilesAdd={(files) => mutations.addFiles.mutate({ files, project: project, user: user! })}
              onFileDelete={(fileId) => {
                const file = project.briefFiles?.find(f => f.id === fileId);
                if (file) mutations.deleteFile.mutate(file);
              }}
              onServicesChange={(services) => onFieldChange('services', services)}
              onTagsChange={(tags: Tag[]) => onFieldChange('tags', tags)}
            />
          </TabsContent>
          <TabsContent value="tasks">
            <ProjectTasks
              project={project}
              onTaskAdd={(title) => mutations.addTask.mutate({ project: project, user: user!, title })}
              onTaskAssignUsers={(taskId, userIds) => mutations.assignUsersToTask.mutate({ taskId, userIds })}
              onTaskStatusChange={(taskId, completed) => mutations.updateTask.mutate({ taskId, updates: { completed } })}
              onTaskDelete={(taskId) => mutations.deleteTask.mutate(taskId)}
            />
          </TabsContent>
          <TabsContent value="discussion">
            <ProjectComments
              project={project}
              onAddCommentOrTicket={(text, isTicket, attachment) => mutations.addComment.mutate({ project: project, user: user!, text, isTicket, attachment })}
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