import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Project, AssignedUser } from "@/data/projects";
import { Comment } from "@/components/ProjectComments";
import ProjectInfoCards from "./ProjectInfoCards";
import ProjectDescription from "./ProjectDescription";
import ProjectTeam from "./ProjectTeam";
import ProjectComments from "../ProjectComments";
import { Badge } from "../ui/badge";

interface ProjectMainContentProps {
  project: Project;
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  onAddComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  isEditing: boolean;
  editedProject: Project;
  onFieldChange: (field: keyof Project, value: any) => void;
  onSelectChange: (name: 'status' | 'paymentStatus', value: string) => void;
  onDateChange: (name: 'deadline' | 'paymentDueDate' | 'startDate', date: Date | undefined) => void;
  onBudgetChange: (value: number | undefined) => void;
  availableUsers: AssignedUser[];
}

const ProjectMainContent = ({
  project,
  comments,
  onAddComment,
  isEditing,
  editedProject,
  onFieldChange,
  onSelectChange,
  onDateChange,
  onBudgetChange,
  availableUsers,
}: ProjectMainContentProps) => {
  const ticketCount = project.tickets || 0;

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="comments">
          Comments & Tickets
          {ticketCount > 0 && (
            <Badge variant="secondary" className="ml-2">{ticketCount}</Badge>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-4">
        <ProjectInfoCards
          project={project}
          isEditing={isEditing}
          editedProject={editedProject}
          onSelectChange={onSelectChange}
          onDateChange={onDateChange}
          onBudgetChange={onBudgetChange}
        />
      </TabsContent>
      <TabsContent value="description" className="mt-4">
        <ProjectDescription
          project={project}
          isEditing={isEditing}
          editedDescription={editedProject.description}
          onDescriptionChange={(value) => onFieldChange('description', value)}
        />
      </TabsContent>
      <TabsContent value="team" className="mt-4">
        <ProjectTeam
          project={project}
          isEditing={isEditing}
          editedAssignedTo={editedProject.assignedTo}
          onAssignedToChange={(value) => onFieldChange('assignedTo', value)}
          availableUsers={availableUsers}
        />
      </TabsContent>
      <TabsContent value="comments" className="mt-4">
        <ProjectComments comments={comments} onAddComment={onAddComment} projectId={project.id} />
      </TabsContent>
    </Tabs>
  );
};

export default ProjectMainContent;