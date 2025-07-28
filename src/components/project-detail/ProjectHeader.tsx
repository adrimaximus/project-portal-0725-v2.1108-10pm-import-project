import { Project } from "@/data/projects";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface ProjectHeaderProps {
  project: Project;
  isEditing: boolean;
  editedName: string;
  onNameChange: (name: string) => void;
}

const ProjectHeader = ({ project, isEditing, editedName, onNameChange }: ProjectHeaderProps) => {
  const getStatusBadgeVariant = () => {
    switch (project.status) {
      case "Completed":
        return "default";
      case "On Going":
        return "outline";
      case "Cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-2">
      {isEditing ? (
        <div>
          <label htmlFor="projectName" className="text-xs text-muted-foreground">Project Name</label>
          <Input
            id="projectName"
            value={editedName}
            onChange={(e) => onNameChange(e.target.value)}
            className="text-3xl font-bold tracking-tight h-auto p-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Project Name"
          />
        </div>
      ) : (
        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
      )}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Badge variant={getStatusBadgeVariant()}>{project.status}</Badge>
        <span>
          Due by {format(new Date(project.deadline), "PPP")}
        </span>
      </div>
    </div>
  );
};

export default ProjectHeader;