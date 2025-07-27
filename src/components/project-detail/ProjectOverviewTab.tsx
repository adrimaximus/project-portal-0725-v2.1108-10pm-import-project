import { Project, AssignedUser } from "@/data/projects";
import ProjectDescription from "./ProjectDescription";
import ProjectTeam from "./ProjectTeam";
import ProjectBrief from "./ProjectBrief";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO, isBefore, isAfter, isToday, isTomorrow } from 'date-fns';

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
    try {
      const now = new Date();
      const startDate = parseISO(project.startDate);
      const deadline = parseISO(project.deadline);

      // Case 1: After deadline
      if (isAfter(now, deadline)) {
        return <Badge className="bg-black text-white hover:bg-black/80">Done</Badge>;
      }

      // Case 2: On or after start date (but not after deadline)
      if (isToday(startDate) || isAfter(now, startDate)) {
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">On Going</Badge>;
      }

      // Case 3: Before start date
      if (isBefore(now, startDate)) {
        if (isTomorrow(startDate)) {
          return <Badge variant="secondary">Tomorrow</Badge>;
        }
        const daysUntilStart = differenceInDays(startDate, now);
        return <Badge variant="secondary">{daysUntilStart} day{daysUntilStart !== 1 ? 's' : ''} to go</Badge>;
      }

      return null; // Should not be reached if dates are valid

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