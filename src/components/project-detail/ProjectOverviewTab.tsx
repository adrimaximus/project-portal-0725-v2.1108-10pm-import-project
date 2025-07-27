import { Project, AssignedUser } from "@/data/projects";
import ProjectDescription from "./ProjectDescription";
import ProjectTeam from "./ProjectTeam";
import ProjectBrief from "./ProjectBrief";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO, isPast } from 'date-fns';

interface ProjectOverviewTabProps {
  project: Project;
  isEditing: boolean;
  onDescriptionChange: (value: string) => void;
  onTeamChange: (selectedUsers: AssignedUser[]) => void;
  onFilesChange: (files: File[]) => void;
}

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-3">
    <h4 className="font-semibold">{title}</h4>
    <div className="text-sm text-muted-foreground">{children}</div>
  </div>
);

const ProjectOverviewTab = ({ project, isEditing, onDescriptionChange, onTeamChange, onFilesChange }: ProjectOverviewTabProps) => {
  const getStatusBadge = () => {
    if (project.status === 'Done') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Done</Badge>;
    }
    if (project.status === 'In Progress') {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">On Going</Badge>;
    }

    try {
      const deadline = parseISO(project.deadline);
      if (isPast(deadline)) {
        return <Badge className="bg-black text-white hover:bg-black/80">Done</Badge>;
      }
      const daysLeft = differenceInDays(deadline, new Date());
      
      if (daysLeft <= 7) {
        return <Badge variant="destructive">{daysLeft} day{daysLeft !== 1 ? 's' : ''} to go</Badge>;
      } else if (daysLeft <= 30) {
        return <Badge className="bg-yellow-200 text-yellow-900 hover:bg-yellow-200/80">{daysLeft} day{daysLeft !== 1 ? 's' : ''} to go</Badge>;
      } else {
        return <Badge variant="secondary">{daysLeft} day{daysLeft !== 1 ? 's' : ''} to go</Badge>;
      }
    } catch (error) {
      return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <Section title="Project Owner">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={project.createdBy.avatar} alt={project.createdBy.name} />
              <AvatarFallback>{project.createdBy.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-primary">{project.createdBy.name}</p>
              <p className="text-xs">{project.createdBy.role}</p>
            </div>
          </div>
        </Section>
        {getStatusBadge()}
      </div>

      <Section title="Description">
        <ProjectDescription
          description={project.description}
          isEditing={isEditing}
          onDescriptionChange={onDescriptionChange}
        />
      </Section>

      <Section title="Assigned Team">
        <ProjectTeam
          assignedTo={project.assignedTo}
          isEditing={isEditing}
          onTeamChange={onTeamChange}
        />
      </Section>

      <Section title="Attachments">
        <ProjectBrief
          files={project.briefFiles || []}
          isEditing={isEditing}
          onFilesChange={onFilesChange}
        />
      </Section>
    </div>
  );
};

export default ProjectOverviewTab;