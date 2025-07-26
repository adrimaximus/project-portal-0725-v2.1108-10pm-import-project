import { Project } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectHeaderProps {
  project: Project;
  isEditing: boolean;
  onEditToggle: () => void;
  onSaveChanges: () => void;
  onCancel: () => void;
}

const ProjectHeader = ({ project, isEditing, onEditToggle, onSaveChanges, onCancel }: ProjectHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-4 px-0 hover:bg-transparent">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Button>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button onClick={onSaveChanges}>Save Changes</Button>
            </>
          ) : (
            <Button onClick={onEditToggle}>Edit Project</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;