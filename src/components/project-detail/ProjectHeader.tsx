import { Project } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Loader2, MoreVertical, Trash2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../StatusBadge";
import { getStatusStyles, cn } from "@/lib/utils";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectHeaderProps {
  project: Project;
  isEditing: boolean;
  isSaving: boolean;
  onEditToggle: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
  canEdit: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
  onToggleComplete: () => void;
  onDeleteProject: () => void;
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
  onToggleComplete,
  onDeleteProject,
}: ProjectHeaderProps) => {
  const navigate = useNavigate();
  const statusStyles = getStatusStyles(project.status);
  const isCompleted = project.status === 'Completed';

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground px-0 hover:bg-transparent">
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
          <div className="lg:col-span-1 flex justify-start lg:justify-end items-center gap-2">
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
              <>
                <Button
                  variant={isCompleted ? "default" : "outline"}
                  onClick={onToggleComplete}
                  className={cn(isCompleted && "bg-green-600 hover:bg-green-700")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isCompleted ? "Completed" : "Mark Complete"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={onEditToggle}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onDeleteProject} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader;