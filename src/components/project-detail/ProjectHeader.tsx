import { Project } from "@/data/projects";
import { Button } from "@/components/ui/button";

interface ProjectHeaderProps {
  project: Project;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const ProjectHeader = ({ project, isEditing, onEdit, onSave, onCancel }: ProjectHeaderProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-muted-foreground">{project.category}</p>
      </div>
      <div className="flex items-center space-x-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={onSave}>Save Changes</Button>
          </>
        ) : (
          <Button onClick={onEdit}>Edit Project</Button>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader;