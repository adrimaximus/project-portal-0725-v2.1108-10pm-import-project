import { Project } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectHeaderProps {
  project: Project;
  isEditing: boolean;
  onEditToggle: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
  canEdit: boolean;
}

const ProjectHeader = ({
  project,
  isEditing,
  onEditToggle,
  onSaveChanges,
  onCancelChanges,
  canEdit,
}: ProjectHeaderProps) => {
  const navigate = useNavigate();

  const getStatusBadgeVariant = (status: Project["status"]) => {
    switch (status) {
      case "Completed":
      case "Done":
      case "Billed":
        return "default";
      case "In Progress":
        return "secondary";
      case "On Hold":
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => navigate("/projects")} className="text-muted-foreground px-0 hover:bg-transparent">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          {project.status && <Badge variant={getStatusBadgeVariant(project.status)}>{project.status}</Badge>}
        </div>
        {canEdit && (
          <div className="flex-shrink-0">
            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={onSaveChanges}>Save Changes</Button>
                <Button variant="outline" onClick={onCancelChanges}>Cancel</Button>
              </div>
            ) : (
              <Button onClick={onEditToggle}>
                <Pencil className="mr-2 h-4 w-4" /> Edit Project
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader;