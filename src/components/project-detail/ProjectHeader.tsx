import { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../StatusBadge";
import { getStatusStyles } from "@/lib/utils";
import { Input } from "../ui/input";

interface ProjectHeaderProps {
  project: Project;
  isEditing: boolean;
  isSaving: boolean;
  onEditToggle: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
  canEdit: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
}

const ProjectHeader = ({
  project,
  isEditing,
  isSaving,
  onEditToggle,
  onSaveChanges,
  onCancelChanges,
  canEdit,
  onFieldChange,
}: ProjectHeaderProps) => {
  const navigate = useNavigate();
  const statusStyles = getStatusStyles(project.status);

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => navigate("/projects")} className="text-muted-foreground px-0 hover:bg-transparent">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 items-center">
        <div className="lg:col-span-2 flex items-center gap-3">
          <div className="w-1 h-8" style={{ backgroundColor: statusStyles.hex }} />
          {isEditing ? (
            <Input
              value={project.name || ''}
              onChange={(e) => onFieldChange('name', e.target.value)}
              className="text-3xl font-bold tracking-tight h-auto p-0 border-0 shadow-none focus-visible:ring-0"
            />
          ) : (
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          )}
          {project.status && <StatusBadge status={project.status} />}
        </div>
        {canEdit && (
          <div className="lg:col-span-1 flex justify-start lg:justify-end">
            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={onSaveChanges} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={onCancelChanges} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={onEditToggle}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Project
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader;