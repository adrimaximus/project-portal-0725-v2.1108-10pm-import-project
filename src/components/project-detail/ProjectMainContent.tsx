import { Project, AssignedUser, Task, Comment } from "@/data/projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectOverviewTab from "./ProjectOverviewTab";
import ProjectTasks from "./ProjectTasks";
import ProjectComments from "../ProjectComments";
import ProjectActivityFeed from "./ProjectActivityFeed";

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (users: AssignedUser[]) => void;
  onFilesChange: (files: File[]) => void;
  onServicesChange: (services: string[]) => void;
  onTaskUpdate: (task: Task) => void;
  onCommentAdd: (comment: Comment) => void;
}

const ProjectMainContent = ({
  project,
  isEditing,
  onDescriptionChange,
  onTeamChange,
  onFilesChange,
  onServicesChange,
  onTaskUpdate,
  onCommentAdd,
}: ProjectMainContentProps) => {
  return (
    <div className="p-6">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({project.tasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="comments">Comments ({project.comments?.length || 0})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <ProjectOverviewTab project={project} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-4">
          <ProjectTasks
            tasks={project.tasks || []}
            team={project.assignedTo || []}
            onTaskUpdate={onTaskUpdate}
          />
        </TabsContent>
        <TabsContent value="comments" className="mt-4">
          <ProjectComments
            comments={project.comments || []}
            team={project.assignedTo || []}
            onCommentAdd={onCommentAdd}
          />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ProjectActivityFeed activities={project.activities || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectMainContent;