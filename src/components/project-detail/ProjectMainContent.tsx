import { Project, AssignedUser } from "@/data/projects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectOverview from "./ProjectOverview";
import ProjectComments, { Comment } from "@/components/ProjectComments";

interface ProjectMainContentProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
  onServicesChange: (selectedServices: string[]) => void;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  projectId: string;
  ticketCount: number;
}

const ProjectMainContent = ({
  project,
  isEditing,
  onDescriptionChange,
  onTeamChange,
  onServicesChange,
  comments,
  setComments,
  projectId,
  ticketCount,
}: ProjectMainContentProps) => {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">
          Activity & Tickets
          {ticketCount > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {ticketCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-6">
        <ProjectOverview
          project={project}
          isEditing={isEditing}
          onDescriptionChange={onDescriptionChange}
          onTeamChange={onTeamChange}
          onServicesChange={onServicesChange}
        />
      </TabsContent>
      <TabsContent value="activity" className="mt-6">
        <ProjectComments
          comments={comments}
          setComments={setComments}
          projectId={projectId}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectMainContent;