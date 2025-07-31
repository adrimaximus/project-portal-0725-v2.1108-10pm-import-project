import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project, AssignedUser, Task } from "@/data/projects";
import { Comment } from "@/components/ProjectComments";
import ProjectOverviewTab from "./ProjectOverviewTab";
import ProjectComments from "../ProjectComments";
import { dummyProjects } from "@/data/projects";
import { Badge } from "../ui/badge";
import { MessageSquare, GanttChartSquare } from "lucide-react";

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
  onFilesChange: (files: File[]) => void;
  onServicesChange: (services: string[]) => void;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  projectId: string;
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
  comments,
  setComments,
  projectId,
  ticketCount,
  allProjects,
}: ProjectMainContentProps) => {
  const handleTaskCreate = (newTask: Task) => {
    const projectIndex = dummyProjects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
      const updatedProject = { ...dummyProjects[projectIndex] };
      updatedProject.tasks = [...updatedProject.tasks, newTask];
      dummyProjects[projectIndex] = updatedProject;
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 border-b rounded-none">
            <TabsTrigger value="overview">
              <GanttChartSquare className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
              {ticketCount > 0 && (
                <Badge variant="destructive" className="ml-2">{ticketCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="p-6">
            <ProjectOverviewTab
              project={project}
              isEditing={isEditing}
              onDescriptionChange={onDescriptionChange}
              onTeamChange={onTeamChange}
              onFilesChange={onFilesChange}
              onServicesChange={onServicesChange}
            />
          </TabsContent>
          <TabsContent value="comments" className="p-6">
            <ProjectComments
              comments={comments}
              setComments={setComments}
              projectId={projectId}
              assignableUsers={project.assignedTo}
              allProjects={allProjects}
              onTaskCreate={handleTaskCreate}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProjectMainContent;