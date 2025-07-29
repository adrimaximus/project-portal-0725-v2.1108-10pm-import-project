import { Project } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectHeaderProps {
  project: Project;
  isEditing: boolean;
  onEditToggle: () => void;
  onSaveChanges: () => void;
  onDelete: () => void;
}

const ProjectHeader = ({ project, isEditing, onEditToggle, onSaveChanges, onDelete }: ProjectHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">
            Tracking project progress and details.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Button onClick={onSaveChanges}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          ) : (
            <Button onClick={onEditToggle}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Project
            </Button>
          )}
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;